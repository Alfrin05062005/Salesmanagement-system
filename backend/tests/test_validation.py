def test_login_missing_fields_returns_422(client):
    response = client.post("/api/auth/login", data={})
    assert response.status_code == 422


def test_create_product_negative_price_rejected(client, admin_user):
    from tests.conftest import auth_headers
    headers = auth_headers(client, "admin", "Admin@123")
    response = client.post(
        "/api/products",
        json={"sku": "NEG-1", "name": "Bad Product", "price": -5, "stock_quantity": 1},
        headers=headers,
    )
    assert response.status_code == 422


def test_create_product_duplicate_sku_rejected(client, admin_user, sample_product):
    from tests.conftest import auth_headers
    headers = auth_headers(client, "admin", "Admin@123")
    response = client.post(
        "/api/products",
        json={"sku": sample_product.sku, "name": "Duplicate SKU Product", "price": 10, "stock_quantity": 1},
        headers=headers,
    )
    assert response.status_code == 400


def test_get_nonexistent_order_returns_404(client, salesman_user):
    from tests.conftest import auth_headers
    headers = auth_headers(client, "salesman1", "Sales@123")
    response = client.get("/api/orders/does-not-exist", headers=headers)
    assert response.status_code == 404


def test_get_nonexistent_customer_returns_404(client, salesman_user):
    from tests.conftest import auth_headers
    headers = auth_headers(client, "salesman1", "Sales@123")
    response = client.get("/api/customers/does-not-exist", headers=headers)
    assert response.status_code == 404


def test_invalid_email_format_rejected(client, admin_user):
    from tests.conftest import auth_headers
    headers = auth_headers(client, "admin", "Admin@123")
    response = client.post(
        "/api/customers",
        json={"name": "Bad Email Customer", "email": "not-an-email"},
        headers=headers,
    )
    assert response.status_code == 422
