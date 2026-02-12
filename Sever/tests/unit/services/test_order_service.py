from app.extensions import db
from app.models import Cart, CartItem, Order


def _order_service(app):
    with app.app_context():
        from app.services.order_service import OrderService
        return OrderService


def _order_payload(total_amount=1000, payment_method="COD"):
    return {
        "address": {
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com",
            "phone": "0712345678",
            "city": "Nairobi",
            "street": "Moi Avenue",
            "additionalInfo": "Near bus station",
        },
        "payment_method": payment_method,
        "total_amount": total_amount,
    }


def test_create_order_happy_path_cod_clears_cart(app, user, product, cart):
    order_service = _order_service(app)
    db.session.add(CartItem(cart_id=cart.id, product_id=product.id, quantity=1))
    db.session.commit()

    order, error = order_service.create_order(user.id, _order_payload())

    assert error is None
    assert order is not None
    assert order.status == "Order Placed"
    assert Cart.query.filter_by(user_id=user.id).first() is None


def test_create_order_empty_cart_returns_error(app, user):
    order_service = _order_service(app)
    order, error = order_service.create_order(user.id, _order_payload())

    assert order is None
    assert error == "Cart is empty"


def test_create_order_missing_address_returns_error(app, user, product, cart):
    order_service = _order_service(app)
    db.session.add(CartItem(cart_id=cart.id, product_id=product.id, quantity=1))
    db.session.commit()

    payload = _order_payload()
    payload["address"] = None

    order, error = order_service.create_order(user.id, payload)

    assert order is None
    assert error == "Failed to create address"


def test_update_order_status_rejects_invalid_transition(app, order):
    order_service = _order_service(app)
    success, message = order_service.update_order_status(order.id, "Canceled")

    assert success is False
    assert "Invalid status" in message


def test_update_payment_status_unknown_order_fails(app, db):
    order_service = _order_service(app)
    success, message = order_service.update_payment_status("PHK-404", {"status": "Failed"})

    assert success is False
    assert message == "Order or payment not found"


def test_update_payment_status_success_updates_order(app, monkeypatch, order):
    order_service = _order_service(app)
    monkeypatch.setattr("app.services.order_service.EmailService.send_order_confirmation", lambda *_: None)
    monkeypatch.setattr("app.services.order_service.create_notification", lambda *_: None)

    success, message = order_service.update_payment_status(
        order.order_reference,
        {
            "status": "Success",
            "transaction_id": "ABC123",
            "mpesa_receipt": "QWE123",
            "result_code": "0",
            "result_desc": "Success",
        },
    )

    refreshed = Order.query.filter_by(order_reference=order.order_reference).first()
    assert success is True
    assert message == "Payment status updated"
    assert refreshed.status == "Order Placed"
    assert refreshed.payment.status == "Success"
