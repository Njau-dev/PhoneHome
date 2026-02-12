def _assert_response_shape(payload):
    assert {"success", "data", "message"}.issubset(payload.keys())


def test_get_cart_happy_path(client, auth_headers, cart_with_items):
    response = client.get("/api/cart/", headers=auth_headers)
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
    assert "cart" in body["data"]


def test_add_to_cart_happy_path(client, auth_headers, product):
    response = client.post(
        "/api/cart/",
        headers=auth_headers,
        json={"productId": product.id, "quantity": 2},
    )
    body = response.get_json()

    assert response.status_code == 201
    _assert_response_shape(body)
    assert body["success"] is True


def test_add_to_cart_missing_fields_validation_error(client, auth_headers):
    response = client.post("/api/cart/", headers=auth_headers, json={"quantity": 1})
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)


def test_remove_from_cart_invalid_id_error(client, auth_headers):
    response = client.delete("/api/cart/", headers=auth_headers, json={"productId": "abc"})
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)


def test_get_cart_unauthenticated(client):
    response = client.get("/api/cart/")

    assert response.status_code == 401
    assert {"error", "message"}.issubset(response.get_json().keys())
