"""
Seed the database with demo data, including the test credentials used
for evaluation. Safe to re-run: it skips creation if data already exists.

Usage:
    python -m app.seed
"""
from app.database import SessionLocal, engine, Base
from app import models
from app.auth import hash_password


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if not db.query(models.User).filter(models.User.username == "admin").first():
            db.add(models.User(
                username="admin",
                full_name="System Administrator",
                hashed_password=hash_password("Admin@123"),
                role=models.UserRole.ADMIN,
            ))

        if not db.query(models.User).filter(models.User.username == "salesman1").first():
            db.add(models.User(
                username="salesman1",
                full_name="John Salesman",
                hashed_password=hash_password("Sales@123"),
                role=models.UserRole.SALESMAN,
            ))
        db.commit()

        if db.query(models.Customer).count() == 0:
            customers = [
                models.Customer(name="Acme Retail Ltd", email="contact@acme.com", phone="9876543210", address="MG Road, Bengaluru"),
                models.Customer(name="Bright Traders", email="info@brighttraders.com", phone="9123456780", address="Anna Nagar, Chennai"),
                models.Customer(name="City Mart", email="sales@citymart.com", phone="9012345678", address="Connaught Place, Delhi"),
            ]
            db.add_all(customers)

        if db.query(models.Product).count() == 0:
            products = [
                models.Product(sku="SKU-001", name="Wireless Mouse", description="2.4GHz wireless mouse", price=499.00, stock_quantity=150),
                models.Product(sku="SKU-002", name="Mechanical Keyboard", description="RGB mechanical keyboard", price=2999.00, stock_quantity=80),
                models.Product(sku="SKU-003", name="USB-C Hub", description="7-in-1 USB-C hub", price=1599.00, stock_quantity=120),
                models.Product(sku="SKU-004", name="27-inch Monitor", description="Full HD IPS monitor", price=12999.00, stock_quantity=40),
                models.Product(sku="SKU-005", name="Laptop Stand", description="Aluminium adjustable stand", price=899.00, stock_quantity=200),
            ]
            db.add_all(products)

        db.commit()
        print("Seed complete.")
        print("Admin login    -> username: admin      password: Admin@123")
        print("Salesman login -> username: salesman1  password: Sales@123")
    finally:
        db.close()


if __name__ == "__main__":
    run()
