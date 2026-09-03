import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base, get_db
from app import models
from app.auth import hash_password

# SQLite in-memory DB shared across a single test's connections.
# NOTE: production runs on PostgreSQL (see docker-compose.yml); SQLite here is
# purely a fast, dependency-free substitute for the DB layer during tests.
SQLALCHEMY_TEST_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture()
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def admin_user(db_session):
    user = models.User(
        username="admin",
        full_name="Admin User",
        hashed_password=hash_password("Admin@123"),
        role=models.UserRole.ADMIN,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def salesman_user(db_session):
    user = models.User(
        username="salesman1",
        full_name="Salesman One",
        hashed_password=hash_password("Sales@123"),
        role=models.UserRole.SALESMAN,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def other_salesman_user(db_session):
    user = models.User(
        username="salesman2",
        full_name="Salesman Two",
        hashed_password=hash_password("Sales@123"),
        role=models.UserRole.SALESMAN,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def sample_customer(db_session):
    customer = models.Customer(name="Test Customer", email="test@customer.com", phone="9999999999")
    db_session.add(customer)
    db_session.commit()
    db_session.refresh(customer)
    return customer


@pytest.fixture()
def sample_product(db_session):
    product = models.Product(sku="SKU-TEST-1", name="Test Widget", price=100.00, stock_quantity=10)
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)
    return product


def auth_headers(client, username, password):
    response = client.post("/api/auth/login", data={"username": username, "password": password})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
