from tests.conftest import auth_headers


def test_salesman_cannot_view_another_salesmans_order(client, salesman_user, other_salesman_user, sample_customer, sample_product):
    headers1 = auth_headers(client, "salesman1", "Sales@123")
    headers2 = auth_headers(client, "salesman2", "Sales@123")

    create_resp = client.post(
        "/api/orders",
        json={"customer_id": sample_customer.id, "items": [{"product_id": sample_product.id, "quantity": 1}]},
        headers=headers1,
    )
    order_id = create_resp.json()["id"]

    response = client.get(f"/api/orders/{order_id}", headers=headers2)
    assert response.status_code == 403


def test_salesman_cannot_access_admin_only_dashboard_summary(client, salesman_user):
    headers = auth_headers(client, "salesman1", "Sales@123")
    response = client.get("/api/orders/analytics/summary", headers=headers)
    assert response.status_code == 403


def test_admin_can_access_dashboard_summary(client, admin_user):
    headers = auth_headers(client, "admin", "Admin@123")
    response = client.get("/api/orders/analytics/summary", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert "total_sales" in body and "total_orders" in body and "total_customers" in body


def test_admin_sees_all_orders_across_salesmen(client, admin_user, salesman_user, other_salesman_user, sample_customer, sample_product):
    headers1 = auth_headers(client, "salesman1", "Sales@123")
    headers2 = auth_headers(client, "salesman2", "Sales@123")
    admin_headers = auth_headers(client, "admin", "Admin@123")

    client.post("/api/orders", json={"customer_id": sample_customer.id, "items": [{"product_id": sample_product.id, "quantity": 1}]}, headers=headers1)
    client.post("/api/orders", json={"customer_id": sample_customer.id, "items": [{"product_id": sample_product.id, "quantity": 1}]}, headers=headers2)

    response = client.get("/api/orders", headers=admin_headers)
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_salesman_cannot_create_products(client, salesman_user):
    headers = auth_headers(client, "salesman1", "Sales@123")
    response = client.post(
        "/api/products",
        json={"sku": "X-1", "name": "Some Product", "price": 10.0, "stock_quantity": 5},
        headers=headers,
    )
    assert response.status_code == 403


def test_admin_can_create_products(client, admin_user):
    headers = auth_headers(client, "admin", "Admin@123")
    response = client.post(
        "/api/products",
        json={"sku": "X-1", "name": "Some Product", "price": 10.0, "stock_quantity": 5},
        headers=headers,
    )
    assert response.status_code == 201


def test_salesman_cannot_list_all_users(client, salesman_user):
    headers = auth_headers(client, "salesman1", "Sales@123")
    response = client.get("/api/users", headers=headers)
    assert response.status_code == 403
