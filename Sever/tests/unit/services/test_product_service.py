from app.models import Product


def _product_service(app):
    with app.app_context():
        from app.services.product_service import ProductService
        return ProductService


def test_get_all_products_happy_path_returns_serialized_products(app, multiple_products):
    product_service = _product_service(app)
    products = product_service.get_all_products()

    assert len(products) >= 1
    assert {"id", "name", "price", "rating", "review_count"}.issubset(products[0].keys())


def test_get_product_by_id_invalid_id_returns_none(app):
    product_service = _product_service(app)
    assert product_service.get_product_by_id(99999) is None


def test_update_product_happy_path_updates_name_and_price(app, product):
    product_service = _product_service(app)
    updated, error = product_service.update_product(product.id, {"name": "Updated Name", "price": "130000"})

    assert error is None
    assert updated.name == "Updated Name"
    assert float(updated.price) == 130000.0


def test_update_product_invalid_id_returns_error(app, db):
    product_service = _product_service(app)
    updated, error = product_service.update_product(55555, {"name": "Missing"})

    assert updated is None
    assert error == "Product not found"


def test_delete_product_happy_path_removes_product(app, product):
    product_service = _product_service(app)
    success, error = product_service.delete_product(product.id)

    assert success is True
    assert error is None
    assert Product.query.get(product.id) is None


def test_delete_product_invalid_id_returns_error(app, db):
    product_service = _product_service(app)
    success, error = product_service.delete_product(123456)

    assert success is False
    assert error == "Product not found"
