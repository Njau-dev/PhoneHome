def _assert_response_shape(payload):
    assert {"success", "data", "message"}.issubset(payload.keys())


def test_signup_happy_path(client):
    response = client.post(
        "/api/auth/signup",
        json={
            "username": "new-user",
            "email": "new@example.com",
            "phone_number": "0712000000",
            "password": "Password123",
        },
    )
    body = response.get_json()

    assert response.status_code == 201
    _assert_response_shape(body)
    assert {"token", "user"}.issubset(body["data"].keys())


def test_signup_missing_fields_validation_error(client):
    response = client.post("/api/auth/signup", json={"email": "x@example.com"})
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)
    assert body["success"] is False


def test_signup_duplicate_email_conflict(client, user):
    response = client.post(
        "/api/auth/signup",
        json={
            "username": "dup",
            "email": user.email,
            "phone_number": "0712111111",
            "password": "Password123",
        },
    )
    body = response.get_json()

    assert response.status_code == 409
    _assert_response_shape(body)
    assert "exists" in body["message"].lower()


def test_login_happy_path(client, user):
    response = client.post("/api/auth/login", json={"email": user.email, "password": "password123"})
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
    assert {"token", "user"}.issubset(body["data"].keys())


def test_logout_unauthenticated_returns_401(client):
    response = client.delete("/api/auth/logout")
    body = response.get_json()

    assert response.status_code == 401
    assert {"error", "message"}.issubset(body.keys())
