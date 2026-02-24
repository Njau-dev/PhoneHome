import os

import requests

from app import create_app
from app.services.mpesa_service import MpesaService

os.environ.setdefault("SECRET_KEY", "test-secret")

_test_app = create_app("testing")
_test_ctx = _test_app.app_context()
_test_ctx.push()


class MockResponse:
    def __init__(self, payload, raises=None):
        self.payload = payload
        self.raises = raises

    def raise_for_status(self):
        if self.raises:
            raise self.raises

    def json(self):
        return self.payload


def _mpesa_config():
    return {
        "MPESA_CONSUMER_KEY": "key",
        "MPESA_CONSUMER_SECRET": "secret",
        "MPESA_BUSINESS_SHORTCODE": "123456",
        "MPESA_TILL_NUMBER": "123456",
        "MPESA_PASSKEY": "passkey",
        "BACKEND_URL": "https://backend.test",
    }


def test_get_access_token_success(monkeypatch):
    service = MpesaService(_mpesa_config())

    monkeypatch.setattr(
        "app.services.mpesa_service.requests.get",
        lambda *args, **kwargs: MockResponse({"access_token": "abc-token"}),
    )

    token, error = service.get_access_token()

    assert token == "abc-token"
    assert error is None


def test_get_access_token_timeout_maps_error(monkeypatch):
    service = MpesaService(_mpesa_config())

    def raise_timeout(*_args, **_kwargs):
        raise requests.exceptions.Timeout("auth timeout")

    monkeypatch.setattr("app.services.mpesa_service.requests.get", raise_timeout)

    token, error = service.get_access_token()

    assert token is None
    assert "Failed to get access token" in error


def test_get_access_token_missing_payload_field_maps_error(monkeypatch):
    service = MpesaService(_mpesa_config())

    monkeypatch.setattr(
        "app.services.mpesa_service.requests.get",
        lambda *args, **kwargs: MockResponse({"token_type": "Bearer"}),
    )

    token, error = service.get_access_token()

    assert token is None
    assert error == "Failed to retrieve access token"


def test_initiate_payment_success_response_mapping(monkeypatch):
    service = MpesaService(_mpesa_config())
    monkeypatch.setattr(service, "get_access_token", lambda: ("token", None))
    monkeypatch.setattr(service, "generate_password", lambda: ("pwd", "20260101010101"))

    captured = {}

    def fake_post(url, json, headers, timeout):
        captured["url"] = url
        captured["json"] = json
        captured["headers"] = headers
        captured["timeout"] = timeout
        return MockResponse(
            {
                "ResponseCode": "0",
                "CheckoutRequestID": "checkout-1",
                "MerchantRequestID": "merchant-1",
                "ResponseDescription": "Accepted",
                "CustomerMessage": "Prompt sent",
            }
        )

    monkeypatch.setattr("app.services.mpesa_service.requests.post", fake_post)

    result = service.initiate_payment("0712345678", 1500, "ORDER-1")

    assert result["success"] is True
    assert result["data"]["checkout_request_id"] == "checkout-1"
    assert captured["json"]["PhoneNumber"] == "254712345678"


def test_initiate_payment_4xx_and_no_retry(monkeypatch):
    service = MpesaService(_mpesa_config())
    monkeypatch.setattr(service, "get_access_token", lambda: ("token", None))
    monkeypatch.setattr(service, "generate_password", lambda: ("pwd", "20260101010101"))

    attempts = {"count": 0}

    def raise_http_error(*_args, **_kwargs):
        attempts["count"] += 1
        raise requests.exceptions.HTTPError("400 Client Error")

    monkeypatch.setattr("app.services.mpesa_service.requests.post", raise_http_error)

    result = service.initiate_payment("0712345678", 1500, "ORDER-2")

    assert result["success"] is False
    assert "Payment request failed" in result["error"]
    assert attempts["count"] == 1


def test_initiate_payment_malformed_response_maps_mpesa_error(monkeypatch):
    service = MpesaService(_mpesa_config())
    monkeypatch.setattr(service, "get_access_token", lambda: ("token", None))
    monkeypatch.setattr(service, "generate_password", lambda: ("pwd", "20260101010101"))

    monkeypatch.setattr(
        "app.services.mpesa_service.requests.post",
        lambda *args, **kwargs: MockResponse({"unexpected": "payload"}),
    )

    result = service.initiate_payment("0712345678", 1500, "ORDER-3")

    assert result["success"] is False
    assert result["error"] == "M-Pesa error: STK Push failed"


def test_process_callback_complete_payload_success():
    service = MpesaService(_mpesa_config())
    callback = {
        "Body": {
            "stkCallback": {
                "ResultCode": 0,
                "ResultDesc": "Success",
                "CheckoutRequestID": "checkout-complete",
                "CallbackMetadata": {
                    "Item": [
                        {"Name": "Amount", "Value": 1500},
                        {"Name": "MpesaReceiptNumber", "Value": "ABC123"},
                    ]
                },
            }
        }
    }

    result = service.process_callback(callback)

    assert result["success"] is True
    assert result["data"]["metadata"]["Amount"] == 1500
    assert result["data"]["checkout_request_id"] == "checkout-complete"


def test_process_callback_partial_payload_failure_mapping():
    service = MpesaService(_mpesa_config())
    partial_callback = {
        "Body": {
            "stkCallback": {
                "ResultCode": 1,
                "ResultDesc": "Insufficient funds",
            }
        }
    }

    result = service.process_callback(partial_callback)

    assert result["success"] is False
    assert "Payment failed: Insufficient funds" == result["error"]
    assert result["data"]["checkout_request_id"] is None
    assert result["data"]["metadata"] == {}
