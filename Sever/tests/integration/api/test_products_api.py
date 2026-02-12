def _assert_response_shape(payload):
    assert {"success", "data", "message"}.issubset(payload.keys())


def test_get_products_happy_path(client, multiple_products):
    response = client.get("/api/products/")
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
    assert "products" in body["data"]
    assert isinstance(body["data"]["products"], list)


def test_get_product_happy_path(client, product):
    response = client.get(f"/api/products/{product.id}")
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
    assert "product" in body["data"]
    assert {"id", "name", "price"}.issubset(body["data"]["product"].keys())


def test_get_product_invalid_id_not_found(client):
    response = client.get("/api/products/999999")
    body = response.get_json()

    assert response.status_code == 404
    _assert_response_shape(body)


def test_get_products_by_invalid_type(client):
    response = client.get("/api/products/type/console")
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)


def test_create_product_unauthorized_for_non_admin(client, auth_headers):
    response = client.post("/api/products/", headers=auth_headers, data={"name": "x"})

    assert response.status_code == 403
    assert "error" in response.get_json()
