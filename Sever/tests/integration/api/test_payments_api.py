from app.extensions import db
from app.models import CartItem, Order


def _assert_response_shape(payload):
    assert {"success", "data", "message"}.issubset(payload.keys())


def _payment_payload(total=5000):
    return {
        "phone_number": "254712345678",
        "total_amount": total,
        "address": {
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com",
            "phone": "0712345678",
            "city": "Nairobi",
            "street": "River Road",
            "additionalInfo": "Shop 10",
        },
    }


def test_initiate_mpesa_happy_path(client, auth_headers, cart, product, monkeypatch):
    db.session.add(CartItem(cart_id=cart.id, product_id=product.id, quantity=1))
    db.session.commit()

    class DummyMpesaService:
        def __init__(self, *args, **kwargs):
            pass

        def initiate_payment(self, *args, **kwargs):
            return {
                "success": True,
                "checkout_request_id": "ws_123",
                "merchant_request_id": "mr_123",
            }

    monkeypatch.setattr("app.api.payments.routes.MpesaService", DummyMpesaService)

    response = client.post("/api/payments/mpesa/initiate", headers=auth_headers, json=_payment_payload())
    body = response.get_json()

    assert response.status_code == 201
    _assert_response_shape(body)
    assert {"order_reference", "checkout_request_id"}.issubset(body["data"].keys())


def test_initiate_mpesa_empty_cart_error(client, auth_headers):
    response = client.post("/api/payments/mpesa/initiate", headers=auth_headers, json=_payment_payload())
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)


def test_retry_mpesa_invalid_order_reference(client, auth_headers):
    response = client.post(
        "/api/payments/mpesa/retry",
        headers=auth_headers,
        json={"phone_number": "254712345678", "order_reference": "PHK-404"},
    )
    body = response.get_json()

    assert response.status_code == 404
    _assert_response_shape(body)


def test_get_payment_status_unauthorized_access(client, auth_headers, order, create_user):
    other = create_user(username="other", email="other@ex.com", password="pw")
    order.user_id = other.id
    db.session.commit()

    response = client.get(f"/api/payments/status/{order.order_reference}", headers=auth_headers)
    body = response.get_json()

    assert response.status_code == 403
    _assert_response_shape(body)


def test_callback_invalid_payload_missing_checkout_id(client):
    response = client.post("/api/payments/ganji/inaflow", json={"Body": {"stkCallback": {}}})
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)
    assert {"ResultCode", "ResultDesc"}.issubset(body["data"].keys())
