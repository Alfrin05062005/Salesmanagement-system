from tests.conftest import auth_headers


def test_login_success(client, salesman_user):
    response = client.post("/api/auth/login", data={"username": "salesman1", "password": "Sales@123"})
    assert response.status_code == 200
    body = response.json()
    assert body["access_token"]
    assert body["role"] == "salesman"


def test_login_invalid_password(client, salesman_user):
    response = client.post("/api/auth/login", data={"username": "salesman1", "password": "wrong-password"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"


def test_login_unknown_username(client):
    response = client.post("/api/auth/login", data={"username": "does-not-exist", "password": "whatever"})
    assert response.status_code == 401


def test_protected_route_requires_token(client):
    response = client.get("/api/users/me")
    assert response.status_code == 401


def test_protected_route_with_valid_token(client, salesman_user):
    headers = auth_headers(client, "salesman1", "Sales@123")
    response = client.get("/api/users/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["username"] == "salesman1"


def test_invalid_token_rejected(client):
    response = client.get("/api/users/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert response.status_code == 401
