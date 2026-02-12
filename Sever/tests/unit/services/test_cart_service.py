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


def test_add_to_cart_invalid_quantity_returns_error(app, user, product):
    cart_service = _cart_service(app)
    success, message = cart_service.add_to_cart(user.id, product.id, 0)

    assert success is False
    assert message == "Invalid quantity"


def test_add_to_cart_duplicate_updates_existing_quantity(app, user, product):
    cart_service = _cart_service(app)
    cart_service.add_to_cart(user.id, product.id, 1)
    success, _ = cart_service.add_to_cart(user.id, product.id, 3)

    item = CartItem.query.filter_by(product_id=product.id).first()
    assert success is True
    assert item.quantity == 4


def test_get_cart_contents_empty_dataset_returns_empty_dict(app, user):
    cart_service = _cart_service(app)
    assert cart_service.get_cart_contents(user.id) == {}


def test_remove_from_cart_nonexistent_item_returns_not_found(app, user, product):
    cart_service = _cart_service(app)
    cart_service.get_or_create_cart(user.id)
    success, message = cart_service.remove_from_cart(user.id, product.id)

    assert success is False
    assert message == "Cart item not found"


def test_clear_cart_removes_cart_record(app, cart_with_items):
    cart_service = _cart_service(app)
    user_id = cart_with_items.user_id

    success, message = cart_service.clear_cart(user_id)

    assert success is True
    assert message == "Cart cleared successfully"
    assert Cart.query.filter_by(user_id=user_id).first() is None
