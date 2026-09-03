from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user, require_admin
from app import models, schemas

router = APIRouter(prefix="/api/orders", tags=["orders"])


def _serialize_order(order: models.Order) -> schemas.OrderOut:
    return schemas.OrderOut(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer.name if order.customer else None,
        salesman_id=order.salesman_id,
        salesman_name=order.salesman.full_name if order.salesman else None,
        status=order.status,
        total_amount=order.total_amount,
        created_at=order.created_at,
    )


def _serialize_order_detail(order: models.Order) -> schemas.OrderDetailOut:
    base = _serialize_order(order)
    items = [
        schemas.OrderItemOut(
            id=item.id,
            product_id=item.product_id,
            product_name=item.product.name if item.product else None,
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=item.subtotal,
        )
        for item in order.items
    ]
    return schemas.OrderDetailOut(**base.model_dump(), items=items)


@router.post("", response_model=schemas.OrderDetailOut, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Any authenticated salesman (or admin, for testing/support) can create an order.
    The total is ALWAYS computed server-side from current product prices — the
    client only sends product_id + quantity, never prices, to prevent tampering.
    """
    customer = db.query(models.Customer).filter(models.Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Customer not found")

    # De-duplicate product ids while preserving first-seen quantity aggregation
    quantities_by_product: dict[str, int] = {}
    for item in payload.items:
        quantities_by_product[item.product_id] = quantities_by_product.get(item.product_id, 0) + item.quantity

    order = models.Order(customer_id=customer.id, salesman_id=current_user.id, status=models.OrderStatus.PENDING)
    total = 0
    order_items = []

    for product_id, quantity in quantities_by_product.items():
        product = db.query(models.Product).filter(models.Product.id == product_id).first()
        if not product or not product.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Product {product_id} is not available")
        if product.stock_quantity < quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for '{product.name}' (available: {product.stock_quantity})",
            )

        subtotal = product.price * quantity
        total += subtotal
        product.stock_quantity -= quantity  # reserve stock immediately

        order_items.append(
            models.OrderItem(
                product_id=product.id,
                quantity=quantity,
                unit_price=product.price,
                subtotal=subtotal,
            )
        )

    order.total_amount = total
    order.items = order_items

    db.add(order)
    db.commit()
    db.refresh(order)
    return _serialize_order_detail(order)


@router.get("", response_model=list[schemas.OrderOut])
def list_orders(
    search: Optional[str] = Query(default=None, description="Search by customer or salesman name"),
    status_filter: Optional[models.OrderStatus] = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Salesmen only ever see their own orders. Admins see all orders.
    This is the core authorization rule for order history/list endpoints.
    """
    query = db.query(models.Order).options(joinedload(models.Order.customer), joinedload(models.Order.salesman))

    if current_user.role == models.UserRole.SALESMAN:
        query = query.filter(models.Order.salesman_id == current_user.id)

    if status_filter:
        query = query.filter(models.Order.status == status_filter)

    if search:
        like = f"%{search}%"
        query = query.join(models.Customer).join(models.User, models.Order.salesman_id == models.User.id).filter(
            or_(models.Customer.name.ilike(like), models.User.full_name.ilike(like))
        )

    orders = query.order_by(models.Order.created_at.desc()).all()
    return [_serialize_order(o) for o in orders]


@router.get("/analytics/summary", response_model=schemas.DashboardSummary)
def dashboard_summary(
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    total_sales = db.query(func.coalesce(func.sum(models.Order.total_amount), 0)).filter(
        models.Order.status != models.OrderStatus.CANCELLED
    ).scalar()
    total_orders = db.query(func.count(models.Order.id)).scalar()
    total_customers = db.query(func.count(models.Customer.id)).scalar()
    return schemas.DashboardSummary(total_sales=total_sales, total_orders=total_orders, total_customers=total_customers)


@router.get("/analytics/sales-over-time", response_model=list[schemas.SalesPoint])
def sales_over_time(
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    """Simple daily sales aggregation, used to power the admin dashboard chart."""
    rows = (
        db.query(
            func.date(models.Order.created_at).label("day"),
            func.coalesce(func.sum(models.Order.total_amount), 0).label("total"),
        )
        .filter(models.Order.status != models.OrderStatus.CANCELLED)
        .group_by(func.date(models.Order.created_at))
        .order_by(func.date(models.Order.created_at))
        .all()
    )
    return [schemas.SalesPoint(date=str(r.day), total=r.total) for r in rows]


@router.get("/{order_id}", response_model=schemas.OrderDetailOut)
def get_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    order = (
        db.query(models.Order)
        .options(joinedload(models.Order.items).joinedload(models.OrderItem.product), joinedload(models.Order.customer), joinedload(models.Order.salesman))
        .filter(models.Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if current_user.role == models.UserRole.SALESMAN and order.salesman_id != current_user.id:
        # A salesman may never view another salesman's order, even by guessing the ID.
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this order")

    return _serialize_order_detail(order)


@router.patch("/{order_id}/status", response_model=schemas.OrderDetailOut)
def update_order_status(
    order_id: str,
    payload: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    """Admin-only: confirm or cancel an order."""
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.status = payload.status
    db.commit()
    db.refresh(order)
    return _serialize_order_detail(order)
