from tests.conftest import auth_headers


def test_create_order_calculates_total_correctly(client, salesman_user, sample_customer, sample_product, db_session):
    headers = auth_headers(client, "salesman1", "Sales@123")
    payload = {
        "customer_id": sample_customer.id,
        "items": [{"product_id": sample_product.id, "quantity": 3}],
    }
    response = client.post("/api/orders", json=payload, headers=headers)
    assert response.status_code == 201
    body = response.json()

    # 3 units * price 100.00 = 300.00
    assert float(body["total_amount"]) == 300.00
    assert body["items"][0]["subtotal"] == "300.00" or float(body["items"][0]["subtotal"]) == 300.00
    assert body["status"] == "pending"


def test_create_order_with_multiple_items_sums_correctly(client, salesman_user, sample_customer, db_session):
    from app import models

    product_a = models.Product(sku="A-1", name="Product A", price=50.00, stock_quantity=10)
    product_b = models.Product(sku="B-1", name="Product B", price=25.50, stock_quantity=10)
    db_session.add_all([product_a, product_b])
    db_session.commit()

    headers = auth_headers(client, "salesman1", "Sales@123")
    payload = {
        "customer_id": sample_customer.id,
        "items": [
            {"product_id": product_a.id, "quantity": 2},   # 100.00
            {"product_id": product_b.id, "quantity": 4},   # 102.00
        ],
    }
    response = client.post("/api/orders", json=payload, headers=headers)
    assert response.status_code == 201
    assert float(response.json()["total_amount"]) == 202.00


def test_create_order_rejects_insufficient_stock(client, salesman_user, sample_customer, sample_product):
    headers = auth_headers(client, "salesman1", "Sales@123")
    payload = {
        "customer_id": sample_customer.id,
        "items": [{"product_id": sample_product.id, "quantity": 999}],  # only 10 in stock
    }
    response = client.post("/api/orders", json=payload, headers=headers)
    assert response.status_code == 400
    assert "stock" in response.json()["detail"].lower()


def test_create_order_reduces_stock(client, salesman_user, sample_customer, sample_product, db_session):
    headers = auth_headers(client, "salesman1", "Sales@123")
    payload = {"customer_id": sample_customer.id, "items": [{"product_id": sample_product.id, "quantity": 4}]}
    client.post("/api/orders", json=payload, headers=headers)

    db_session.refresh(sample_product)
    assert sample_product.stock_quantity == 6


def test_create_order_rejects_unknown_customer(client, salesman_user, sample_product):
    headers = auth_headers(client, "salesman1", "Sales@123")
    payload = {"customer_id": "non-existent-id", "items": [{"product_id": sample_product.id, "quantity": 1}]}
    response = client.post("/api/orders", json=payload, headers=headers)
    assert response.status_code == 400


def test_create_order_rejects_empty_items(client, salesman_user, sample_customer):
    headers = auth_headers(client, "salesman1", "Sales@123")
    payload = {"customer_id": sample_customer.id, "items": []}
    response = client.post("/api/orders", json=payload, headers=headers)
    assert response.status_code == 422  # caught by pydantic min_length validation


def test_create_order_rejects_zero_or_negative_quantity(client, salesman_user, sample_customer, sample_product):
    headers = auth_headers(client, "salesman1", "Sales@123")
    payload = {"customer_id": sample_customer.id, "items": [{"product_id": sample_product.id, "quantity": 0}]}
    response = client.post("/api/orders", json=payload, headers=headers)
    assert response.status_code == 422


def test_view_order_history_returns_only_own_orders(client, salesman_user, other_salesman_user, sample_customer, sample_product):
    headers1 = auth_headers(client, "salesman1", "Sales@123")
    headers2 = auth_headers(client, "salesman2", "Sales@123")

    client.post("/api/orders", json={"customer_id": sample_customer.id, "items": [{"product_id": sample_product.id, "quantity": 1}]}, headers=headers1)
    client.post("/api/orders", json={"customer_id": sample_customer.id, "items": [{"product_id": sample_product.id, "quantity": 1}]}, headers=headers2)

    response = client.get("/api/orders", headers=headers1)
    assert response.status_code == 200
    orders = response.json()
    assert len(orders) == 1
    assert orders[0]["salesman_id"] == salesman_user.id
