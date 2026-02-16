def _assert_response_shape(payload):
    assert {"success", "data", "message"}.issubset(payload.keys())


def test_get_wishlist_empty_happy_path(client, auth_headers):
    response = client.get("/api/wishlist/", headers=auth_headers)
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
    assert body["data"]["wishlist"] == []


def test_add_to_wishlist_happy_path(client, auth_headers, product):
    response = client.post("/api/wishlist/", headers=auth_headers, json={"product_id": product.id})
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)


def test_add_to_wishlist_duplicate_returns_201(client, auth_headers, wishlist, product):
    response = client.post("/api/wishlist/", headers=auth_headers, json={"product_id": product.id})
    body = response.get_json()

    assert response.status_code == 201
    _assert_response_shape(body)


def test_add_to_wishlist_invalid_product_id_error(client, auth_headers):
    response = client.post("/api/wishlist/", headers=auth_headers, json={"product_id": "bad"})
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)


def test_remove_from_wishlist_not_found(client, auth_headers, product):
    response = client.delete(f"/api/wishlist/{product.id}", headers=auth_headers)
    body = response.get_json()

    assert response.status_code == 404
    _assert_response_shape(body)
