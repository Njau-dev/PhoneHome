import json
from datetime import UTC, datetime
from types import SimpleNamespace

from app.extensions import db
from app.models import (
    Audio,
    CartItem,
    CompareItem,
    Laptop,
    OrderItem,
    Product,
    ProductVariation,
    Review,
    WishList,
)


def _product_service(app):
    with app.app_context():
        from app.services.product_service import ProductService

        return ProductService


def _phone_payload(category_id, brand_id, **overrides):
    payload = {
        "name": "Unit Test Phone",
        "price": "120000",
        "description": "Phone for unit testing",
        "category_id": category_id,
        "brand_id": brand_id,
        "type": "phone",
        "hasVariation": False,
        "isBestSeller": True,
        "ram": "8GB",
        "storage": "256GB",
        "battery": "5000mAh",
        "main_camera": "48MP",
        "front_camera": "12MP",
        "display": "6.1 inch",
        "processor": "Test Processor",
        "connectivity": "5G",
        "colors": "Black",
        "os": "TestOS",
    }
    payload.update(overrides)
    return payload


def test_get_all_products_happy_path_returns_serialized_products(app, multiple_products):
    product_service = _product_service(app)
    products = product_service.get_all_products()

    assert len(products) >= 1
    assert {"id", "name", "price", "rating", "review_count"}.issubset(products[0].keys())


def test_get_all_products_handles_serialize_error(app, multiple_products, monkeypatch):
    product_service = _product_service(app)

    def _boom(*_args, **_kwargs):
        raise RuntimeError("serialize failed")

    monkeypatch.setattr("app.services.product_service.ProductService._serialize_product", _boom)
    assert product_service.get_all_products() == []


def test_get_product_by_id_invalid_id_returns_none(app):
    product_service = _product_service(app)
    assert product_service.get_product_by_id(99999) is None


def test_get_product_by_id_includes_reviews_when_present(app, product, review):
    product_service = _product_service(app)
    result = product_service.get_product_by_id(product.id)

    assert result is not None
    assert result["id"] == product.id
    assert "reviews" in result
    assert len(result["reviews"]) >= 1


def test_build_product_instance_covers_laptop_and_audio_branches(app, category, brand):
    product_service = _product_service(app)

    laptop = product_service._build_product_instance(
        Laptop,
        {
            "name": "Laptop Test",
            "price": "200000",
            "description": "Laptop",
            "category_id": category.id,
            "brand_id": brand.id,
            "ram": "16GB",
            "storage": "1TB",
            "battery": "7000mAh",
            "display": "15 inch",
            "processor": "Laptop CPU",
            "os": "LaptopOS",
        },
        ["https://example.com/laptop.jpg"],
    )
    audio = product_service._build_product_instance(
        Audio,
        {
            "name": "Audio Test",
            "price": "5000",
            "description": "Audio",
            "category_id": category.id,
            "brand_id": brand.id,
            "battery": "1000mAh",
        },
        ["https://example.com/audio.jpg"],
    )

    assert isinstance(laptop, Laptop)
    assert isinstance(audio, Audio)
    assert laptop.processor == "Laptop CPU"
    assert audio.battery == "1000mAh"


def test_create_product_returns_upload_error(app, category, brand, monkeypatch):
    product_service = _product_service(app)
    monkeypatch.setattr(
        "app.services.product_service.upload_images",
        lambda *_args, **_kwargs: (False, "upload failed"),
    )

    product, error = product_service.create_product(
        _phone_payload(category.id, brand.id),
        image_files=[object()],
    )

    assert product is None
    assert error == "upload failed"


def test_create_product_rejects_invalid_type(app, category, brand, monkeypatch):
    product_service = _product_service(app)
    monkeypatch.setattr(
        "app.services.product_service.upload_images",
        lambda *_args, **_kwargs: (True, ["https://example.com/p.jpg"]),
    )

    product, error = product_service.create_product(
        _phone_payload(category.id, brand.id, type="console"),
        image_files=[object()],
    )

    assert product is None
    assert "Invalid product type" in error


def test_create_product_rejects_invalid_category(app, brand, monkeypatch):
    product_service = _product_service(app)
    monkeypatch.setattr(
        "app.services.product_service.upload_images",
        lambda *_args, **_kwargs: (True, ["https://example.com/p.jpg"]),
    )

    product, error = product_service.create_product(
        _phone_payload(99999, brand.id),
        image_files=[object()],
    )

    assert product is None
    assert error == "Invalid category ID"


def test_create_product_rejects_invalid_brand(app, category, monkeypatch):
    product_service = _product_service(app)
    monkeypatch.setattr(
        "app.services.product_service.upload_images",
        lambda *_args, **_kwargs: (True, ["https://example.com/p.jpg"]),
    )

    product, error = product_service.create_product(
        _phone_payload(category.id, 99999),
        image_files=[object()],
    )

    assert product is None
    assert error == "Invalid brand ID"


def test_create_product_happy_path_with_json_variations(app, category, brand, monkeypatch):
    product_service = _product_service(app)
    monkeypatch.setattr(
        "app.services.product_service.upload_images",
        lambda *_args, **_kwargs: (True, ["https://example.com/p.jpg"]),
    )

    variations = json.dumps(
        [
            {"ram": "8GB", "storage": "256GB", "price": 100000},
            {"ram": "12GB", "storage": "512GB", "price": 120000},
        ]
    )
    product, error = product_service.create_product(
        _phone_payload(category.id, brand.id, hasVariation=True, variations=variations),
        image_files=[object()],
    )

    assert error is None
    assert product is not None
    assert ProductVariation.query.filter_by(product_id=product.id).count() == 2


def test_create_product_happy_path_with_list_variations(app, category, brand, monkeypatch):
    product_service = _product_service(app)
    monkeypatch.setattr(
        "app.services.product_service.upload_images",
        lambda *_args, **_kwargs: (True, ["https://example.com/p.jpg"]),
    )

    product, error = product_service.create_product(
        _phone_payload(
            category.id,
            brand.id,
            hasVariation=True,
            variations=[{"ram": "6GB", "storage": "128GB", "price": 90000}],
        ),
        image_files=[object()],
    )

    assert error is None
    assert product is not None
    assert ProductVariation.query.filter_by(product_id=product.id).count() == 1


def test_create_product_invalid_variations_payload_returns_error(app, category, brand, monkeypatch):
    product_service = _product_service(app)
    monkeypatch.setattr(
        "app.services.product_service.upload_images",
        lambda *_args, **_kwargs: (True, ["https://example.com/p.jpg"]),
    )

    product, error = product_service.create_product(
        _phone_payload(category.id, brand.id, hasVariation=True, variations="{invalid"),
        image_files=[object()],
    )

    assert product is None
    assert error


def test_update_product_happy_path_updates_name_and_price(app, product):
    product_service = _product_service(app)
    updated, error = product_service.update_product(
        product.id, {"name": "Updated Name", "price": "130000"}
    )

    assert error is None
    assert updated.name == "Updated Name"
    assert float(updated.price) == 130000.0


def test_update_product_invalid_id_returns_error(app, db):
    product_service = _product_service(app)
    updated, error = product_service.update_product(55555, {"name": "Missing"})

    assert updated is None
    assert error == "Product not found"


def test_update_product_updates_images_and_variations(app, product_with_variation, monkeypatch):
    product_service = _product_service(app)
    uploaded = {}

    def _fake_upload(*_args, **_kwargs):
        uploaded["called"] = True
        return True, ["https://example.com/new.jpg"]

    monkeypatch.setattr(
        "app.services.product_service.upload_images",
        _fake_upload,
    )

    updated, error = product_service.update_product(
        product_with_variation.id,
        {
            "name": "Galaxy Updated",
            "hasVariation": True,
            "battery": "4500mAh",
            "variations": [
                {"ram": "8GB", "storage": "256GB", "price": 101000},
                {"ram": "16GB", "storage": "1TB", "price": 160000},
            ],
        },
        new_image_files=[object()],
    )

    refreshed = Product.query.get(product_with_variation.id)
    updated_existing = ProductVariation.query.filter_by(
        product_id=product_with_variation.id, ram="8GB", storage="256GB"
    ).first()
    added_variation = ProductVariation.query.filter_by(
        product_id=product_with_variation.id, ram="16GB", storage="1TB"
    ).first()

    assert error is None
    assert uploaded["called"] is True
    assert updated.name == "Galaxy Updated"
    assert refreshed.battery == "4500mAh"
    assert float(updated_existing.price) == 101000.0
    assert added_variation is not None


def test_update_product_handles_failed_image_upload_without_failing_update(
    app, product, monkeypatch
):
    product_service = _product_service(app)
    original_images = list(product.image_urls)

    monkeypatch.setattr(
        "app.services.product_service.upload_images",
        lambda *_args, **_kwargs: (False, "upload failed"),
    )

    updated, error = product_service.update_product(
        product.id, {"name": "No image append"}, new_image_files=[object()]
    )

    assert error is None
    assert updated.name == "No image append"
    assert updated.image_urls == original_images


def test_update_product_invalid_variations_payload_returns_error(app, product_with_variation):
    product_service = _product_service(app)

    updated, error = product_service.update_product(
        product_with_variation.id,
        {"hasVariation": True, "variations": "{bad-json"},
    )

    assert updated is None
    assert error


def test_update_product_handles_internal_exception(app, product, monkeypatch):
    product_service = _product_service(app)

    def _boom(*_args, **_kwargs):
        raise RuntimeError("boom")

    monkeypatch.setattr(
        "app.services.product_service.ProductService._update_type_specific_fields", _boom
    )

    updated, error = product_service.update_product(product.id, {"name": "X"})

    assert updated is None
    assert "boom" in error


def test_serialize_reviews_handles_missing_user_as_anonymous(app, db):
    product_service = _product_service(app)
    review = SimpleNamespace(
        id=1,
        user_id=99999,
        rating=4,
        comment="Nice",
        created_at=datetime.now(UTC),
    )

    serialized = product_service._serialize_reviews([review])

    assert len(serialized) == 1
    assert serialized[0]["user_name"] == "Anonymous"


def test_delete_product_happy_path_removes_product(app, product):
    product_service = _product_service(app)
    success, error = product_service.delete_product(product.id)

    assert success is True
    assert error is None
    assert Product.query.get(product.id) is None


def test_delete_product_removes_related_records(
    app, product, cart, wishlist, compare_list, order, review
):
    product_service = _product_service(app)
    db.session.add(CartItem(cart_id=cart.id, product_id=product.id, quantity=1))
    db.session.commit()

    success, error = product_service.delete_product(product.id)
    refreshed_wishlist = WishList.query.get(wishlist.id)

    assert success is True
    assert error is None
    assert CartItem.query.filter_by(product_id=product.id).count() == 0
    assert OrderItem.query.filter_by(product_id=product.id).count() == 0
    assert CompareItem.query.filter_by(product_id=product.id).count() == 0
    assert Review.query.filter_by(product_id=product.id).count() == 0
    assert all(p.id != product.id for p in refreshed_wishlist.products)


def test_delete_product_invalid_id_returns_error(app, db):
    product_service = _product_service(app)
    success, error = product_service.delete_product(123456)

    assert success is False
    assert error == "Product not found"


def test_delete_product_handles_internal_exception(app, product, monkeypatch):
    product_service = _product_service(app)

    def _boom(*_args, **_kwargs):
        raise RuntimeError("delete boom")

    monkeypatch.setattr("app.services.product_service.db.session.delete", _boom)

    success, error = product_service.delete_product(product.id)

    assert success is False
    assert "delete boom" in error
