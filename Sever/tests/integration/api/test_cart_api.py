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


def test_get_cart_handles_service_exception(client, auth_headers, monkeypatch):
    monkeypatch.setattr(
        "app.api.cart.routes.CartService.get_cart_contents",
        lambda _user_id: (_ for _ in ()).throw(RuntimeError("boom")),
    )

    response = client.get("/api/cart/", headers=auth_headers)
    body = response.get_json()

    assert response.status_code == 500
    _assert_response_shape(body)
    assert body["message"] == "An error occurred while fetching cart"


def test_add_to_cart_rejects_invalid_product_id(client, auth_headers):
    response = client.post(
        "/api/cart/",
        headers=auth_headers,
        json={"productId": "abc", "quantity": 1},
    )
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)
    assert body["message"] == "Invalid productId. Must be an integer"


def test_add_to_cart_rejects_invalid_quantity(client, auth_headers, product):
    response = client.post(
        "/api/cart/",
        headers=auth_headers,
        json={"productId": product.id, "quantity": 0},
    )
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)
    assert body["message"] == "Invalid quantity. Must be a positive integer"


def test_add_to_cart_rejects_non_object_variation(client, auth_headers, product):
    response = client.post(
        "/api/cart/",
        headers=auth_headers,
        json={"productId": product.id, "quantity": 1, "selectedVariation": "8GB"},
    )
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)
    assert body["message"] == "Invalid selectedVariation. Must be an object"


def test_add_to_cart_rejects_incomplete_variation(client, auth_headers, product):
    response = client.post(
        "/api/cart/",
        headers=auth_headers,
        json={
            "productId": product.id,
            "quantity": 1,
            "selectedVariation": {"ram": "8GB", "storage": "128GB"},
        },
    )
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)
    assert body["message"] == "Variation must include ram, storage, and price"


def test_add_to_cart_rejects_invalid_variation_price(client, auth_headers, product):
    response = client.post(
        "/api/cart/",
        headers=auth_headers,
        json={
            "productId": product.id,
            "quantity": 1,
            "selectedVariation": {"ram": "8GB", "storage": "128GB", "price": 0},
        },
    )
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)
    assert body["message"] == "Invalid variation price"


def test_add_to_cart_handles_service_failure(client, auth_headers, product, monkeypatch):
    monkeypatch.setattr(
        "app.api.cart.routes.CartService.add_to_cart",
        lambda *_args, **_kwargs: (False, "Product not found"),
    )

    response = client.post(
        "/api/cart/",
        headers=auth_headers,
        json={"productId": product.id, "quantity": 2},
    )
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)
    assert body["message"] == "Product not found"


def test_add_to_cart_handles_exception(client, auth_headers, product, monkeypatch):
    monkeypatch.setattr(
        "app.api.cart.routes.CartService.add_to_cart",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(RuntimeError("service exploded")),
    )

    response = client.post(
        "/api/cart/",
        headers=auth_headers,
        json={"productId": product.id, "quantity": 2},
    )
    body = response.get_json()

    assert response.status_code == 500
    _assert_response_shape(body)
    assert body["message"] == "An error occurred while adding to cart"


def test_update_cart_item_happy_path(client, auth_headers, product):
    client.post("/api/cart/", headers=auth_headers, json={"productId": product.id, "quantity": 1})
    response = client.put(
        "/api/cart/",
        headers=auth_headers,
        json={"productId": product.id, "quantity": 3},
    )
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
    assert body["success"] is True


def test_update_cart_item_requires_fields(client, auth_headers):
    response = client.put("/api/cart/", headers=auth_headers, json={"quantity": 2})
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)
    assert body["message"] == "productId and quantity are required"


def test_update_cart_item_rejects_invalid_product_id(client, auth_headers):
    response = client.put(
        "/api/cart/",
        headers=auth_headers,
        json={"productId": "abc", "quantity": 2},
    )
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)
    assert body["message"] == "Invalid productId. Must be an integer"


def test_update_cart_item_rejects_invalid_quantity(client, auth_headers, product):
    response = client.put(
        "/api/cart/",
        headers=auth_headers,
        json={"productId": product.id, "quantity": -1},
    )
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)
    assert body["message"] == "Invalid quantity. Must be a positive integer"


def test_update_cart_item_normalizes_null_variation(client, auth_headers, product, monkeypatch):
    calls = {}

    def fake_update_cart_item(_user_id, _product_id, _quantity, variation_name):
        calls["variation_name"] = variation_name
        return True, "updated"

    monkeypatch.setattr("app.api.cart.routes.CartService.update_cart_item", fake_update_cart_item)

    response = client.put(
        "/api/cart/",
        headers=auth_headers,
        json={"productId": product.id, "quantity": 2, "selectedVariation": "null"},
    )
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
    assert calls["variation_name"] is None


def test_update_cart_item_not_found_maps_404(client, auth_headers, product, monkeypatch):
    monkeypatch.setattr(
        "app.api.cart.routes.CartService.update_cart_item",
        lambda *_args, **_kwargs: (False, "Cart item not found"),
    )

    response = client.put(
        "/api/cart/",
        headers=auth_headers,
        json={"productId": product.id, "quantity": 2},
    )
    body = response.get_json()

    assert response.status_code == 404
    _assert_response_shape(body)
    assert body["message"] == "Cart item not found"


def test_update_cart_item_service_error_maps_400(client, auth_headers, product, monkeypatch):
    monkeypatch.setattr(
        "app.api.cart.routes.CartService.update_cart_item",
        lambda *_args, **_kwargs: (False, "Invalid quantity"),
    )

    response = client.put(
        "/api/cart/",
        headers=auth_headers,
        json={"productId": product.id, "quantity": 2},
    )
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)
    assert body["message"] == "Invalid quantity"


def test_update_cart_item_handles_exception(client, auth_headers, product, monkeypatch):
    monkeypatch.setattr(
        "app.api.cart.routes.CartService.update_cart_item",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(RuntimeError("boom")),
    )

    response = client.put(
        "/api/cart/",
        headers=auth_headers,
        json={"productId": product.id, "quantity": 2},
    )
    body = response.get_json()

    assert response.status_code == 500
    _assert_response_shape(body)
    assert body["message"] == "An error occurred while updating cart"


def test_remove_from_cart_invalid_id_error(client, auth_headers):
    response = client.delete("/api/cart/", headers=auth_headers, json={"productId": "abc"})
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)


def test_remove_from_cart_requires_product_id(client, auth_headers):
    response = client.delete("/api/cart/", headers=auth_headers, json={})
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)
    assert body["message"] == "productId is required"


def test_remove_from_cart_normalizes_null_variation(client, auth_headers, product, monkeypatch):
    calls = {}

    def fake_remove_from_cart(_user_id, _product_id, variation_name):
        calls["variation_name"] = variation_name
        return True, "removed"

    monkeypatch.setattr("app.api.cart.routes.CartService.remove_from_cart", fake_remove_from_cart)

    response = client.delete(
        "/api/cart/",
        headers=auth_headers,
        json={"productId": product.id, "selectedVariation": "null"},
    )
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
    assert calls["variation_name"] is None


def test_remove_from_cart_not_found_maps_404(client, auth_headers, product, monkeypatch):
    monkeypatch.setattr(
        "app.api.cart.routes.CartService.remove_from_cart",
        lambda *_args, **_kwargs: (False, "Cart item not found"),
    )

    response = client.delete(
        "/api/cart/",
        headers=auth_headers,
        json={"productId": product.id},
    )
    body = response.get_json()

    assert response.status_code == 404
    _assert_response_shape(body)
    assert body["message"] == "Cart item not found"


def test_remove_from_cart_service_error_maps_400(client, auth_headers, product, monkeypatch):
    monkeypatch.setattr(
        "app.api.cart.routes.CartService.remove_from_cart",
        lambda *_args, **_kwargs: (False, "Cannot remove product"),
    )

    response = client.delete(
        "/api/cart/",
        headers=auth_headers,
        json={"productId": product.id},
    )
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)
    assert body["message"] == "Cannot remove product"


def test_remove_from_cart_handles_exception(client, auth_headers, product, monkeypatch):
    monkeypatch.setattr(
        "app.api.cart.routes.CartService.remove_from_cart",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(RuntimeError("boom")),
    )

    response = client.delete(
        "/api/cart/",
        headers=auth_headers,
        json={"productId": product.id},
    )
    body = response.get_json()

    assert response.status_code == 500
    _assert_response_shape(body)
    assert body["message"] == "An error occurred while removing from cart"


def test_clear_cart_happy_path(client, auth_headers, cart_with_items):
    response = client.delete("/api/cart/clear", headers=auth_headers)
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
    assert body["success"] is True


def test_clear_cart_handles_service_failure(client, auth_headers, monkeypatch):
    monkeypatch.setattr(
        "app.api.cart.routes.CartService.clear_cart",
        lambda *_args, **_kwargs: (False, "Could not clear cart"),
    )

    response = client.delete("/api/cart/clear", headers=auth_headers)
    body = response.get_json()

    assert response.status_code == 500
    _assert_response_shape(body)
    assert body["message"] == "Could not clear cart"


def test_clear_cart_handles_exception(client, auth_headers, monkeypatch):
    monkeypatch.setattr(
        "app.api.cart.routes.CartService.clear_cart",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(RuntimeError("explode")),
    )

    response = client.delete("/api/cart/clear", headers=auth_headers)
    body = response.get_json()

    assert response.status_code == 500
    _assert_response_shape(body)
    assert body["message"] == "An error occurred while clearing cart"


def test_get_cart_total_happy_path(client, auth_headers, cart_with_items):
    response = client.get("/api/cart/total", headers=auth_headers)
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
    assert body["data"]["currency"] == "KES"
    assert isinstance(body["data"]["total"], float)


def test_get_cart_total_handles_exception(client, auth_headers, monkeypatch):
    monkeypatch.setattr(
        "app.api.cart.routes.CartService.get_cart_total",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(RuntimeError("explode")),
    )

    response = client.get("/api/cart/total", headers=auth_headers)
    body = response.get_json()

    assert response.status_code == 500
    _assert_response_shape(body)
    assert body["message"] == "An error occurred while calculating total"


def test_get_cart_unauthenticated(client):
    response = client.get("/api/cart/")

    assert response.status_code == 401
    assert {"error", "message"}.issubset(response.get_json().keys())
