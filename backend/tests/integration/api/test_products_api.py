import io
from types import SimpleNamespace

import pytest


def _assert_response_shape(payload):
    assert {"success", "data", "message"}.issubset(payload.keys())


def _sample_products():
    return [
        {
            "id": 1,
            "name": "Phone 1",
            "type": "phone",
            "category": "Phone",
            "brand_id": 1,
            "isBestSeller": True,
            "price": 1000.0,
            "created_at": "2026-01-01T10:00:00",
        },
        {
            "id": 2,
            "name": "Phone 2",
            "type": "phone",
            "category": "Phone",
            "brand_id": 1,
            "isBestSeller": True,
            "price": 2000.0,
            "created_at": "2026-01-03T10:00:00",
        },
        {
            "id": 3,
            "name": "Laptop 1",
            "type": "laptop",
            "category": "Laptop",
            "brand_id": 2,
            "isBestSeller": False,
            "price": 1500.0,
            "created_at": "2026-01-02T10:00:00",
        },
    ]


def _minimal_create_form(category_id, brand_id, product_type="phone"):
    form = {
        "name": "Test Product",
        "price": "999.99",
        "description": "Test description",
        "category_id": str(category_id),
        "brand_id": str(brand_id),
        "type": product_type,
        "image_urls": (io.BytesIO(b"image-bytes"), "product.jpg"),
    }
    if product_type in {"phone", "tablet"}:
        form.update(
            {
                "ram": "8GB",
                "storage": "256GB",
                "battery": "5000mAh",
                "main_camera": "48MP",
                "front_camera": "12MP",
                "display": "6.1 inch",
                "processor": "Test Chip",
                "connectivity": "5G",
                "colors": "Black",
                "os": "TestOS",
            }
        )
    elif product_type == "laptop":
        form.update(
            {
                "ram": "16GB",
                "storage": "512GB",
                "battery": "6000mAh",
                "display": "15 inch",
                "processor": "Laptop Chip",
                "os": "LaptopOS",
            }
        )
    elif product_type == "audio":
        form.update({"battery": "1000mAh"})
    return form


def test_get_products_happy_path(client, multiple_products):
    response = client.get("/api/products/")
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
    assert isinstance(body["data"]["products"], list)


def test_get_products_applies_filters_sort_and_limit(client, monkeypatch):
    monkeypatch.setattr("app.api.products.routes.ProductService.get_all_products", _sample_products)

    response = client.get(
        "/api/products/?type=phone&category=Phone&brand=1&best_seller=true&sort=price_desc&limit=1"
    )
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
    assert len(body["data"]["products"]) == 1
    assert body["data"]["products"][0]["id"] == 2


def test_get_products_handles_invalid_brand_and_limit_params(client, monkeypatch):
    monkeypatch.setattr("app.api.products.routes.ProductService.get_all_products", _sample_products)

    response = client.get("/api/products/?brand=not-an-int&limit=invalid")
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
    assert len(body["data"]["products"]) == 3


@pytest.mark.parametrize(
    ("sort_value", "expected_first_id"),
    [("oldest", 1), ("price_asc", 1), ("price_desc", 2)],
)
def test_get_products_sort_paths(client, monkeypatch, sort_value, expected_first_id):
    monkeypatch.setattr("app.api.products.routes.ProductService.get_all_products", _sample_products)

    response = client.get(f"/api/products/?sort={sort_value}")
    body = response.get_json()

    assert response.status_code == 200
    assert body["data"]["products"][0]["id"] == expected_first_id


def test_get_products_handles_service_exception(client, monkeypatch):
    def _boom():
        raise RuntimeError("boom")

    monkeypatch.setattr("app.api.products.routes.ProductService.get_all_products", _boom)

    response = client.get("/api/products/")
    body = response.get_json()

    assert response.status_code == 500
    _assert_response_shape(body)
    assert body["success"] is False


def test_get_product_happy_path(client, product):
    response = client.get(f"/api/products/{product.id}")
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
    assert {"id", "name", "price"}.issubset(body["data"]["product"].keys())


def test_get_product_invalid_id_not_found(client):
    response = client.get("/api/products/999999")
    body = response.get_json()

    assert response.status_code == 404
    _assert_response_shape(body)


def test_get_product_handles_service_exception(client, monkeypatch):
    def _boom(_product_id):
        raise RuntimeError("boom")

    monkeypatch.setattr("app.api.products.routes.ProductService.get_product_by_id", _boom)

    response = client.get("/api/products/1")
    body = response.get_json()

    assert response.status_code == 500
    _assert_response_shape(body)


def test_create_product_unauthorized_for_non_admin(client, auth_headers):
    response = client.post("/api/products/", headers=auth_headers, data={"name": "x"})

    assert response.status_code == 403
    assert "error" in response.get_json()


def test_create_product_missing_required_field_returns_400(client, admin_headers):
    form = _minimal_create_form(category_id=1, brand_id=1)
    form.pop("name")

    response = client.post(
        "/api/products/",
        headers=admin_headers,
        data=form,
        content_type="multipart/form-data",
    )
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)
    assert "Missing required field" in body["message"]


def test_create_product_requires_image_file(client, admin_headers):
    form = _minimal_create_form(category_id=1, brand_id=1)
    form.pop("image_urls")

    response = client.post(
        "/api/products/",
        headers=admin_headers,
        data=form,
        content_type="multipart/form-data",
    )
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)
    assert "image" in body["message"].lower()


@pytest.mark.parametrize(
    ("product_type", "expected_field"),
    [("phone", "main_camera"), ("laptop", "processor"), ("audio", "battery")],
)
def test_create_product_builds_type_specific_payload(
    client, admin_headers, category, brand, monkeypatch, product_type, expected_field
):
    captured = {}

    def _fake_create(product_data, image_files):
        captured["product_data"] = product_data
        captured["images_count"] = len(image_files)
        return SimpleNamespace(id=77, name=product_data["name"]), None

    monkeypatch.setattr("app.api.products.routes.ProductService.create_product", _fake_create)
    monkeypatch.setattr(
        "app.api.products.routes.ProductService.get_product_by_id",
        lambda _product_id: {"id": 77, "name": "Created"},
    )

    response = client.post(
        "/api/products/",
        headers=admin_headers,
        data=_minimal_create_form(category.id, brand.id, product_type=product_type),
        content_type="multipart/form-data",
    )
    body = response.get_json()

    assert response.status_code == 201
    _assert_response_shape(body)
    assert captured["images_count"] == 1
    assert captured["product_data"]["type"] == product_type
    assert expected_field in captured["product_data"]


def test_create_product_surfaces_service_error(client, admin_headers, category, brand, monkeypatch):
    monkeypatch.setattr(
        "app.api.products.routes.ProductService.create_product",
        lambda *_args, **_kwargs: (None, "bad payload"),
    )

    response = client.post(
        "/api/products/",
        headers=admin_headers,
        data=_minimal_create_form(category.id, brand.id),
        content_type="multipart/form-data",
    )
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)
    assert body["message"] == "bad payload"


def test_create_product_handles_exception(client, admin_headers, category, brand, monkeypatch):
    def _boom(*_args, **_kwargs):
        raise RuntimeError("boom")

    monkeypatch.setattr("app.api.products.routes.ProductService.create_product", _boom)

    response = client.post(
        "/api/products/",
        headers=admin_headers,
        data=_minimal_create_form(category.id, brand.id),
        content_type="multipart/form-data",
    )
    body = response.get_json()

    assert response.status_code == 500
    _assert_response_shape(body)


def test_update_product_happy_path_forwards_update_payload(client, admin_headers, product, monkeypatch):
    captured = {}

    def _fake_update(product_id, product_data, new_image_files):
        captured["product_id"] = product_id
        captured["product_data"] = product_data
        captured["new_image_count"] = len(new_image_files)
        return SimpleNamespace(id=product_id, name="Updated"), None

    monkeypatch.setattr("app.api.products.routes.ProductService.update_product", _fake_update)
    monkeypatch.setattr(
        "app.api.products.routes.ProductService.get_product_by_id",
        lambda _product_id: {"id": product.id, "name": "Updated"},
    )

    response = client.put(
        f"/api/products/{product.id}",
        headers=admin_headers,
        data={
            "name": "Updated",
            "hasVariation": "true",
            "isBestSeller": "false",
            "variations": "[]",
            "ram": "12GB",
            "image_urls": (io.BytesIO(b"new"), "new.jpg"),
        },
        content_type="multipart/form-data",
    )
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
    assert captured["product_id"] == product.id
    assert captured["product_data"]["hasVariation"] is True
    assert captured["product_data"]["isBestSeller"] is False
    assert captured["new_image_count"] == 1


def test_update_product_not_found_maps_to_404(client, admin_headers, product, monkeypatch):
    monkeypatch.setattr(
        "app.api.products.routes.ProductService.update_product",
        lambda *_args, **_kwargs: (None, "Product not found"),
    )

    response = client.put(
        f"/api/products/{product.id}",
        headers=admin_headers,
        data={"name": "Updated"},
        content_type="multipart/form-data",
    )
    body = response.get_json()

    assert response.status_code == 404
    _assert_response_shape(body)


def test_update_product_generic_error_maps_to_400(client, admin_headers, product, monkeypatch):
    monkeypatch.setattr(
        "app.api.products.routes.ProductService.update_product",
        lambda *_args, **_kwargs: (None, "Validation failed"),
    )

    response = client.put(
        f"/api/products/{product.id}",
        headers=admin_headers,
        data={"name": "Updated"},
        content_type="multipart/form-data",
    )
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)


def test_update_product_handles_exception(client, admin_headers, product, monkeypatch):
    def _boom(*_args, **_kwargs):
        raise RuntimeError("boom")

    monkeypatch.setattr("app.api.products.routes.ProductService.update_product", _boom)

    response = client.put(
        f"/api/products/{product.id}",
        headers=admin_headers,
        data={"name": "Updated"},
        content_type="multipart/form-data",
    )
    body = response.get_json()

    assert response.status_code == 500
    _assert_response_shape(body)


def test_delete_product_success(client, admin_headers, product, monkeypatch):
    monkeypatch.setattr(
        "app.api.products.routes.ProductService.delete_product",
        lambda _product_id: (True, None),
    )

    response = client.delete(f"/api/products/{product.id}", headers=admin_headers)
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)


def test_delete_product_not_found(client, admin_headers, product, monkeypatch):
    monkeypatch.setattr(
        "app.api.products.routes.ProductService.delete_product",
        lambda _product_id: (False, "Product not found"),
    )

    response = client.delete(f"/api/products/{product.id}", headers=admin_headers)
    body = response.get_json()

    assert response.status_code == 404
    _assert_response_shape(body)


def test_delete_product_handles_generic_failure(client, admin_headers, product, monkeypatch):
    monkeypatch.setattr(
        "app.api.products.routes.ProductService.delete_product",
        lambda _product_id: (False, "db down"),
    )

    response = client.delete(f"/api/products/{product.id}", headers=admin_headers)
    body = response.get_json()

    assert response.status_code == 500
    _assert_response_shape(body)


def test_delete_product_handles_exception(client, admin_headers, product, monkeypatch):
    def _boom(_product_id):
        raise RuntimeError("boom")

    monkeypatch.setattr("app.api.products.routes.ProductService.delete_product", _boom)

    response = client.delete(f"/api/products/{product.id}", headers=admin_headers)
    body = response.get_json()

    assert response.status_code == 500
    _assert_response_shape(body)


def test_get_products_by_invalid_type(client):
    response = client.get("/api/products/type/console")
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)


def test_get_products_by_type_success(client, monkeypatch):
    monkeypatch.setattr("app.api.products.routes.ProductService.get_all_products", _sample_products)

    response = client.get("/api/products/type/phone")
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
    assert len(body["data"]["products"]) == 2


def test_get_products_by_type_handles_exception(client, monkeypatch):
    def _boom():
        raise RuntimeError("boom")

    monkeypatch.setattr("app.api.products.routes.ProductService.get_all_products", _boom)

    response = client.get("/api/products/type/phone")
    body = response.get_json()

    assert response.status_code == 500
    _assert_response_shape(body)


def test_get_products_by_category_not_found(client):
    response = client.get("/api/products/category/999999")
    body = response.get_json()

    assert response.status_code == 404
    _assert_response_shape(body)


def test_get_products_by_category_success(client, category, monkeypatch):
    monkeypatch.setattr("app.api.products.routes.ProductService.get_all_products", _sample_products)

    response = client.get(f"/api/products/category/{category.id}")
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
    assert all(p["category"] == category.name for p in body["data"]["products"])


def test_get_products_by_category_handles_exception(client, monkeypatch):
    class _BrokenCategory:
        class query:
            @staticmethod
            def get(_category_id):
                raise RuntimeError("db down")

    monkeypatch.setattr("app.api.products.routes.Category", _BrokenCategory)

    response = client.get("/api/products/category/1")
    body = response.get_json()

    assert response.status_code == 500
    _assert_response_shape(body)


def test_add_product_variations_not_found(client, admin_headers):
    response = client.post(
        "/api/products/999999/variations",
        headers=admin_headers,
        json={"variations": [{"ram": "8GB", "storage": "256GB", "price": 1000}]},
    )
    body = response.get_json()

    assert response.status_code == 404
    _assert_response_shape(body)


def test_add_product_variations_requires_payload(client, admin_headers, product):
    response = client.post(f"/api/products/{product.id}/variations", headers=admin_headers, json={})
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)


def test_add_product_variations_surfaces_service_error(client, admin_headers, product, monkeypatch):
    monkeypatch.setattr(
        "app.api.products.routes.ProductService.update_product",
        lambda *_args, **_kwargs: (None, "invalid variations"),
    )

    response = client.post(
        f"/api/products/{product.id}/variations",
        headers=admin_headers,
        json={"variations": [{"ram": "8GB", "storage": "256GB", "price": 1000}]},
    )
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)


def test_add_product_variations_success(client, admin_headers, product, monkeypatch):
    monkeypatch.setattr(
        "app.api.products.routes.ProductService.update_product",
        lambda *_args, **_kwargs: (product, None),
    )

    response = client.post(
        f"/api/products/{product.id}/variations",
        headers=admin_headers,
        json={"variations": [{"ram": "8GB", "storage": "256GB", "price": 1000}]},
    )
    body = response.get_json()

    assert response.status_code == 201
    _assert_response_shape(body)


def test_add_product_variations_handles_exception(client, admin_headers, product, monkeypatch):
    def _boom(*_args, **_kwargs):
        raise RuntimeError("boom")

    monkeypatch.setattr("app.api.products.routes.ProductService.update_product", _boom)

    response = client.post(
        f"/api/products/{product.id}/variations",
        headers=admin_headers,
        json={"variations": [{"ram": "8GB", "storage": "256GB", "price": 1000}]},
    )
    body = response.get_json()

    assert response.status_code == 500
    _assert_response_shape(body)
