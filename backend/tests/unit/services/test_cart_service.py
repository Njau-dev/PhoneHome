from types import SimpleNamespace

from app.models import Cart, CartItem


def _cart_service(app):
    with app.app_context():
        from app.services.cart_service import CartService

        return CartService


def test_add_to_cart_happy_path_creates_item(app, user, product):
    cart_service = _cart_service(app)
    success, message = cart_service.add_to_cart(user.id, product.id, 2)

    item = CartItem.query.filter_by(product_id=product.id).first()
    assert success is True
    assert "added" in message.lower()
    assert item is not None
    assert item.quantity == 2


def test_get_cart_contents_groups_items_and_variations(app, cart_with_items):
    cart_service = _cart_service(app)

    item = CartItem.query.filter_by(cart_id=cart_with_items.id).first()
    item.variation_name = "8GB - 256GB"
    item.variation_price = 1234.0
    from app.extensions import db

    db.session.commit()

    contents = cart_service.get_cart_contents(cart_with_items.user_id)

    assert contents[item.product_id]["8GB - 256GB"]["quantity"] == item.quantity
    assert contents[item.product_id]["8GB - 256GB"]["price"] == 1234.0


def test_get_cart_contents_handles_exception(app, user, monkeypatch):
    cart_service = _cart_service(app)

    class BrokenQuery:
        def filter_by(self, **_kwargs):
            raise RuntimeError("query failed")

    monkeypatch.setattr("app.services.cart_service.Cart.query", BrokenQuery())

    assert cart_service.get_cart_contents(user.id) == {}


def test_add_to_cart_invalid_quantity_returns_error(app, user, product):
    cart_service = _cart_service(app)
    success, message = cart_service.add_to_cart(user.id, product.id, 0)

    assert success is False
    assert message == "Invalid quantity"


def test_add_to_cart_returns_product_not_found_for_unknown_product(app, user):
    cart_service = _cart_service(app)
    success, message = cart_service.add_to_cart(user.id, 999999, 1)

    assert success is False
    assert message == "Product not found"


def test_add_to_cart_duplicate_updates_existing_quantity(app, user, product):
    cart_service = _cart_service(app)
    cart_service.add_to_cart(user.id, product.id, 1)
    success, _ = cart_service.add_to_cart(user.id, product.id, 3)

    item = CartItem.query.filter_by(product_id=product.id).first()
    assert success is True
    assert item.quantity == 4


def test_add_to_cart_handles_commit_exception(app, user, product, monkeypatch):
    cart_service = _cart_service(app)

    monkeypatch.setattr(
        "app.services.cart_service.db.session.commit",
        lambda: (_ for _ in ()).throw(RuntimeError("commit failed")),
    )

    success, message = cart_service.add_to_cart(user.id, product.id, 1)

    assert success is False
    assert "commit failed" in message


def test_get_cart_contents_empty_dataset_returns_empty_dict(app, user):
    cart_service = _cart_service(app)
    assert cart_service.get_cart_contents(user.id) == {}


def test_update_cart_item_cart_not_found_returns_error(app, user, product):
    cart_service = _cart_service(app)
    success, message = cart_service.update_cart_item(user.id, product.id, 2)

    assert success is False
    assert message == "Cart not found"


def test_update_cart_item_invalid_quantity_returns_error(app, cart, product):
    cart_service = _cart_service(app)
    success, message = cart_service.update_cart_item(cart.user_id, product.id, 0)

    assert success is False
    assert message == "Invalid quantity"


def test_update_cart_item_nonexistent_item_returns_not_found(app, cart, product):
    cart_service = _cart_service(app)
    success, message = cart_service.update_cart_item(cart.user_id, product.id, 2)

    assert success is False
    assert message == "Cart item not found"


def test_update_cart_item_happy_path_updates_quantity(app, user, product):
    cart_service = _cart_service(app)
    cart_service.add_to_cart(user.id, product.id, 1)

    success, message = cart_service.update_cart_item(user.id, product.id, 5)

    item = CartItem.query.filter_by(product_id=product.id).first()
    assert success is True
    assert message == "Cart item updated successfully"
    assert item.quantity == 5


def test_update_cart_item_handles_exception(app, user, product, monkeypatch):
    cart_service = _cart_service(app)
    cart_service.add_to_cart(user.id, product.id, 1)

    monkeypatch.setattr(
        "app.services.cart_service.db.session.commit",
        lambda: (_ for _ in ()).throw(RuntimeError("commit failed")),
    )

    success, message = cart_service.update_cart_item(user.id, product.id, 2)

    assert success is False
    assert "commit failed" in message


def test_remove_from_cart_cart_not_found_returns_error(app, user, product):
    cart_service = _cart_service(app)
    success, message = cart_service.remove_from_cart(user.id, product.id)

    assert success is False
    assert message == "Cart not found"


def test_remove_from_cart_nonexistent_item_returns_not_found(app, user, product):
    cart_service = _cart_service(app)
    cart_service.get_or_create_cart(user.id)
    success, message = cart_service.remove_from_cart(user.id, product.id)

    assert success is False
    assert message == "Cart item not found"


def test_remove_from_cart_happy_path_removes_item(app, user, product):
    cart_service = _cart_service(app)
    cart_service.add_to_cart(user.id, product.id, 1)

    success, message = cart_service.remove_from_cart(user.id, product.id)

    assert success is True
    assert message == "Cart item removed successfully"
    assert CartItem.query.filter_by(product_id=product.id).first() is None


def test_remove_from_cart_deletes_cart_when_last_item_branch(app, user, product, monkeypatch):
    cart_service = _cart_service(app)
    cart = cart_service.get_or_create_cart(user.id)
    cart_item = CartItem(cart_id=cart.id, product_id=product.id, quantity=1)
    from app.extensions import db

    db.session.add(cart_item)
    db.session.commit()

    class QueryStub:
        def __init__(self, item):
            self.item = item

        def filter_by(self, **kwargs):
            if "product_id" in kwargs:
                return SimpleNamespace(first=lambda: self.item)
            return SimpleNamespace(count=lambda: 1)

    monkeypatch.setattr("app.services.cart_service.CartItem.query", QueryStub(cart_item))

    success, _ = cart_service.remove_from_cart(user.id, product.id)

    assert success is True
    assert Cart.query.filter_by(user_id=user.id).first() is None


def test_remove_from_cart_handles_exception(app, user, product, monkeypatch):
    cart_service = _cart_service(app)
    cart_service.add_to_cart(user.id, product.id, 1)

    monkeypatch.setattr(
        "app.services.cart_service.db.session.delete",
        lambda _obj: (_ for _ in ()).throw(RuntimeError("delete failed")),
    )

    success, message = cart_service.remove_from_cart(user.id, product.id)

    assert success is False
    assert "delete failed" in message


def test_clear_cart_removes_cart_record(app, cart_with_items):
    cart_service = _cart_service(app)
    user_id = cart_with_items.user_id

    success, message = cart_service.clear_cart(user_id)

    assert success is True
    assert message == "Cart cleared successfully"
    assert Cart.query.filter_by(user_id=user_id).first() is None


def test_clear_cart_returns_already_empty_when_no_cart(app, user):
    cart_service = _cart_service(app)
    success, message = cart_service.clear_cart(user.id)

    assert success is True
    assert message == "Cart already empty"


def test_clear_cart_handles_exception(app, cart_with_items, monkeypatch):
    cart_service = _cart_service(app)

    monkeypatch.setattr(
        "app.services.cart_service.db.session.delete",
        lambda _obj: (_ for _ in ()).throw(RuntimeError("delete failed")),
    )

    success, message = cart_service.clear_cart(cart_with_items.user_id)

    assert success is False
    assert "delete failed" in message


def test_get_cart_total_returns_zero_when_cart_missing(app, user):
    cart_service = _cart_service(app)
    assert cart_service.get_cart_total(user.id) == 0.0


def test_get_cart_total_calculates_variation_and_base_prices(app, cart_with_items):
    cart_service = _cart_service(app)
    item = CartItem.query.filter_by(cart_id=cart_with_items.id).first()
    item.variation_price = 1000.0
    from app.extensions import db

    db.session.commit()

    total = cart_service.get_cart_total(cart_with_items.user_id)

    assert isinstance(total, float)
    assert total > 0


def test_get_cart_total_handles_exception(app, user, monkeypatch):
    cart_service = _cart_service(app)

    class BrokenQuery:
        def filter_by(self, **_kwargs):
            raise RuntimeError("query failed")

    monkeypatch.setattr("app.services.cart_service.Cart.query", BrokenQuery())

    assert cart_service.get_cart_total(user.id) == 0.0
