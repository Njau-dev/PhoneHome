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

    response = client.post(
        "/api/payments/mpesa/initiate",
        headers=auth_headers,
        json=_payment_payload(total=float(product.price)),
    )
    body = response.get_json()

    assert response.status_code == 201
    _assert_response_shape(body)
    assert {"order_reference", "checkout_request_id"}.issubset(body["data"].keys())


def test_initiate_mpesa_empty_cart_error(client, auth_headers):
    response = client.post("/api/payments/mpesa/initiate", headers=auth_headers, json=_payment_payload())
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)


def test_initiate_mpesa_missing_required_field_error(client, auth_headers):
    payload = _payment_payload()
    payload.pop("phone_number")

    response = client.post("/api/payments/mpesa/initiate", headers=auth_headers, json=payload)
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)
    assert "phone_number is required" in body["message"]


def test_initiate_mpesa_non_positive_amount_rejected(client, auth_headers, cart, product):
    db.session.add(CartItem(cart_id=cart.id, product_id=product.id, quantity=1))
    db.session.commit()

    payload = _payment_payload(total=0)
    response = client.post("/api/payments/mpesa/initiate", headers=auth_headers, json=payload)
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)
    assert "greater than 0" in body["message"]


def test_initiate_mpesa_stk_failure_marks_order_failed(client, auth_headers, cart, product, monkeypatch):
    db.session.add(CartItem(cart_id=cart.id, product_id=product.id, quantity=1))
    db.session.commit()

    class FailingMpesaService:
        def __init__(self, *args, **kwargs):
            pass

        def initiate_payment(self, *args, **kwargs):
            return {"success": False, "error": "gateway down"}

    monkeypatch.setattr("app.api.payments.routes.MpesaService", FailingMpesaService)

    response = client.post(
        "/api/payments/mpesa/initiate",
        headers=auth_headers,
        json=_payment_payload(total=float(product.price)),
    )
    body = response.get_json()

    latest_order = Order.query.order_by(Order.id.desc()).first()
    assert response.status_code == 400
    _assert_response_shape(body)
    assert body["message"] == "gateway down"
    assert latest_order is not None
    assert latest_order.status == "Payment Failed"


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


def test_callback_payment_record_not_found(client):
    response = client.post(
        "/api/payments/ganji/inaflow",
        json={
            "Body": {
                "stkCallback": {
                    "CheckoutRequestID": "unknown-checkout-id",
                    "ResultCode": 1,
                    "ResultDesc": "Failed",
                }
            }
        },
    )
    body = response.get_json()

    assert response.status_code == 404
    _assert_response_shape(body)
    assert body["message"] == "Payment record not found"


def test_callback_success_maps_metadata_and_calls_order_service(client, order, monkeypatch):
    order.payment.checkout_request_id = "checkout-success-001"
    db.session.commit()

    captured = {}

    def _fake_update(order_reference, payment_data):
        captured["order_reference"] = order_reference
        captured["payment_data"] = payment_data
        return True, "ok"

    monkeypatch.setattr("app.api.payments.routes.OrderService.update_payment_status", _fake_update)

    response = client.post(
        "/api/payments/ganji/inaflow",
        json={
            "Body": {
                "stkCallback": {
                    "CheckoutRequestID": "checkout-success-001",
                    "ResultCode": 0,
                    "ResultDesc": "Success",
                    "CallbackMetadata": {
                        "Item": [
                            {"Name": "MpesaReceiptNumber", "Value": "ABC123XYZ"},
                            {"Name": "PhoneNumber", "Value": 254712345678},
                        ]
                    },
                }
            }
        },
    )
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
    assert captured["order_reference"] == order.order_reference
    assert captured["payment_data"]["status"] == "Success"
    assert captured["payment_data"]["mpesa_receipt"] == "ABC123XYZ"
    assert captured["payment_data"]["transaction_id"] == "ABC123XYZ"
    assert captured["payment_data"]["phone_number"] == "254712345678"


def test_callback_update_failure_is_non_blocking(client, order, monkeypatch):
    order.payment.checkout_request_id = "checkout-failure-001"
    db.session.commit()

    monkeypatch.setattr(
        "app.api.payments.routes.OrderService.update_payment_status",
        lambda *args, **kwargs: (False, "update failed"),
    )

    response = client.post(
        "/api/payments/ganji/inaflow",
        json={
            "Body": {
                "stkCallback": {
                    "CheckoutRequestID": "checkout-failure-001",
                    "ResultCode": 1,
                    "ResultDesc": "Request cancelled",
                }
            }
        },
    )
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
