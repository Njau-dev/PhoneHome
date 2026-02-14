import base64
import importlib
import logging
from datetime import UTC, datetime
from types import SimpleNamespace

import pytest

from app import create_app

_test_app = create_app("testing")
_test_app.config["BREVO_API_KEY"] = "context-brevo-key"
_test_app.config["SECRET_KEY"] = "context-secret-key"
_test_ctx = _test_app.app_context()
_test_ctx.push()

email_service_module = importlib.import_module("app.services.email_service")
EmailService = email_service_module.EmailService

_MISSING = object()


def _email_config(**overrides):
    config = {
        "BREVO_API_KEY": "brevo-test-key",
        "SECRET_KEY": "secret",
        "BREVO_SENDER_EMAIL": "sender@example.com",
        "BREVO_SENDER_NAME": "Phone Home",
        "BACKEND_URL": "https://api.phonehome.test",
    }
    config.update(overrides)
    return config


def _address(email="buyer@example.com"):
    return SimpleNamespace(
        first_name="Jane",
        last_name="Doe",
        street="123 Market Street",
        city="Nairobi",
        email=email,
        phone="0712345678",
    )


def _order(address=_MISSING, order_items=None):
    return SimpleNamespace(
        address=_address() if address is _MISSING else address,
        order_reference="ORD-12345",
        order_items=order_items if order_items is not None else [],
        created_at=datetime(2026, 1, 10, 8, 45, tzinfo=UTC),
        total_amount=2500.0,
    )


def _payment(order=None, status="Success", transaction_id="TX-001", mpesa_receipt="MPESA-001"):
    return SimpleNamespace(
        order=order if order is not None else _order(),
        status=status,
        amount=2500.0,
        payment_method="M-Pesa",
        created_at=datetime(2026, 1, 10, 9, 0, tzinfo=UTC),
        transaction_id=transaction_id,
        mpesa_receipt=mpesa_receipt,
    )


def _order_item_for_review(order=None):
    return SimpleNamespace(
        order=order if order is not None else _order(),
        product=SimpleNamespace(name="Pixel 9"),
        product_id=99,
    )


def test_init_app_returns_service():
    app = SimpleNamespace(config=_email_config())
    service = EmailService.init_app(app)
    assert isinstance(service, EmailService)


def test_init_uses_current_app_config_when_config_not_provided(monkeypatch):
    monkeypatch.setattr(
        email_service_module,
        "current_app",
        SimpleNamespace(config=_email_config(BREVO_API_KEY="from-current-app")),
    )
    service = EmailService()
    assert service.brevo_api_key == "from-current-app"


def test_validate_config_requires_brevo_api_key():
    with pytest.raises(ValueError, match="BREVO_API_KEY is required"):
        EmailService(_email_config(BREVO_API_KEY=None))


def test_validate_config_requires_secret_key():
    with pytest.raises(ValueError, match="SECRET_KEY is required"):
        EmailService(_email_config(SECRET_KEY=None))


def test_send_email_returns_not_configured_when_key_is_missing(caplog):
    service = EmailService(_email_config())
    service.brevo_api_key = None

    with caplog.at_level(logging.ERROR):
        result = service._send_email("to@example.com", "Subject", "<p>Body</p>")

    assert result == {"success": False, "error": "Email service not configured"}
    assert "BREVO_API_KEY not configured" in caplog.text


def test_send_email_success_maps_response_and_attachments(monkeypatch):
    service = EmailService(_email_config())
    sent = {}

    class DummyApi:
        def send_transac_email(self, payload):
            sent["payload"] = payload

    monkeypatch.setattr("app.services.email_service.ApiClient", lambda _config: object())
    monkeypatch.setattr(
        "app.services.email_service.TransactionalEmailsApi", lambda _client: DummyApi()
    )
    monkeypatch.setattr(
        "app.services.email_service.SendSmtpEmailTo",
        lambda email, name=None: SimpleNamespace(email=email, name=name),
    )
    monkeypatch.setattr(
        "app.services.email_service.SendSmtpEmail",
        lambda **kwargs: SimpleNamespace(**kwargs),
    )

    attachments = [SimpleNamespace(name="invoice.pdf", content="ZW1haWw=")]
    result = service._send_email(
        "to@example.com",
        "Subject",
        "<p>Body</p>",
        attachments=attachments,
    )

    assert result == {"success": True}
    assert sent["payload"].subject == "Subject"
    assert sent["payload"].attachment == attachments
    assert sent["payload"].sender.email == "sender@example.com"
    assert sent["payload"].to[0].email == "to@example.com"


def test_send_email_exception_is_mapped_and_logged(monkeypatch, caplog):
    service = EmailService(_email_config())

    class ExplodingApi:
        def send_transac_email(self, _payload):
            raise RuntimeError("transient sdk failure")

    monkeypatch.setattr("app.services.email_service.ApiClient", lambda _config: object())
    monkeypatch.setattr(
        "app.services.email_service.TransactionalEmailsApi",
        lambda _client: ExplodingApi(),
    )

    with caplog.at_level(logging.ERROR):
        result = service._send_email("to@example.com", "Subject", "<p>Body</p>")

    assert result["success"] is False
    assert "Failed to send email" in result["error"]
    assert "Failed to send email to to@example.com" in caplog.text


def test_generate_pdf_success_returns_attachment(monkeypatch):
    service = EmailService(_email_config())

    class DummyAttachment:
        def __init__(self, name, content):
            self.name = name
            self.content = content

    def fake_create_pdf(content, dest):
        assert content == "<h1>Invoice</h1>"
        dest.write(b"fake-pdf-content")
        return SimpleNamespace(err=False)

    monkeypatch.setattr("app.services.email_service.pisa.CreatePDF", fake_create_pdf)
    monkeypatch.setattr("app.services.email_service.SendSmtpEmailAttachment", DummyAttachment)

    attachment = service._generate_pdf("<h1>Invoice</h1>", "invoice_123")

    assert attachment.name == "invoice_123.pdf"
    assert attachment.content == base64.b64encode(b"fake-pdf-content").decode("utf-8")


def test_generate_pdf_returns_none_when_pdf_generation_fails(monkeypatch, caplog):
    service = EmailService(_email_config())

    def fake_create_pdf(_content, dest=None):
        return SimpleNamespace(err=True)

    monkeypatch.setattr("app.services.email_service.pisa.CreatePDF", fake_create_pdf)

    with caplog.at_level(logging.ERROR):
        result = service._generate_pdf("<h1>Invoice</h1>", "invoice_123")

    assert result is None
    assert "Failed to generate PDF" in caplog.text


def test_generate_pdf_returns_none_on_exception(monkeypatch, caplog):
    service = EmailService(_email_config())

    def fake_create_pdf(_content, dest=None):
        raise RuntimeError("engine unavailable")

    monkeypatch.setattr("app.services.email_service.pisa.CreatePDF", fake_create_pdf)

    with caplog.at_level(logging.ERROR):
        result = service._generate_pdf("<h1>Invoice</h1>", "invoice_123")

    assert result is None
    assert "Error generating PDF invoice_123" in caplog.text


def test_render_template_injects_current_year(monkeypatch):
    service = EmailService(_email_config())
    captured = {}

    def fake_render_template_string(source, **context):
        captured["source"] = source
        captured["context"] = context
        return "rendered-template"

    monkeypatch.setattr(
        "app.services.email_service.render_template_string",
        fake_render_template_string,
    )

    result = service._render_template("{{ subject }}", subject="Hello", content="Body")

    assert result == "rendered-template"
    assert captured["source"] == "{{ subject }}"
    assert captured["context"]["subject"] == "Hello"
    assert "current_year" in captured["context"]


def test_render_template_raises_on_render_error(monkeypatch, caplog):
    service = EmailService(_email_config())

    def explode(*_args, **_kwargs):
        raise ValueError("template parse error")

    monkeypatch.setattr("app.services.email_service.render_template_string", explode)

    with caplog.at_level(logging.ERROR):
        with pytest.raises(ValueError, match="template parse error"):
            service._render_template("{{ subject }}", subject="Hello")

    assert "Template rendering failed" in caplog.text


def test_send_password_reset_success(monkeypatch):
    service = EmailService(_email_config())
    calls = {}

    monkeypatch.setattr(
        service, "_render_template", lambda **_kwargs: "<html>Password reset</html>"
    )

    def fake_send_email(**kwargs):
        calls.update(kwargs)
        return {"success": True}

    monkeypatch.setattr(service, "_send_email", fake_send_email)

    result = service.send_password_reset("user@example.com", "https://reset.example.com/token")

    assert result == {"success": True}
    assert calls["to_email"] == "user@example.com"
    assert calls["subject"] == "Password Reset Request"
    assert "Password reset" in calls["html_content"]


def test_send_password_reset_handles_template_render_errors(monkeypatch):
    service = EmailService(_email_config())

    def boom(*_args, **_kwargs):
        raise ValueError("malformed template")

    monkeypatch.setattr(service, "_render_template", boom)

    result = service.send_password_reset("user@example.com", "http://example.com/reset")

    assert result["success"] is False
    assert "Failed to send password reset email" in result["error"]


def test_send_order_confirmation_returns_error_when_email_missing():
    service = EmailService(_email_config())
    order = _order(address=None)
    result = service.send_order_confirmation(order)
    assert result == {"success": False, "error": "Order has no email address"}


def test_send_order_confirmation_success_with_attachment_and_item_format_error(monkeypatch):
    service = EmailService(_email_config())
    send_calls = {}
    render_calls = []

    good_item = SimpleNamespace(
        variation_price=None,
        product=SimpleNamespace(name="Galaxy S24", price=1200.0),
        quantity=2,
    )
    bad_item = SimpleNamespace(
        variation_price=None,
        product=None,
        quantity=1,
    )
    order = _order(order_items=[good_item, bad_item])

    def fake_render_template(*_args, **kwargs):
        render_calls.append(kwargs)
        return "<html>rendered</html>"

    monkeypatch.setattr(service, "_render_template", fake_render_template)
    monkeypatch.setattr(service, "_generate_pdf", lambda _content, _name: "pdf-attachment")

    def fake_send_email(**kwargs):
        send_calls.update(kwargs)
        return {"success": True}

    monkeypatch.setattr(service, "_send_email", fake_send_email)

    result = service.send_order_confirmation(order)

    assert result == {"success": True}
    assert len(render_calls) == 2
    assert send_calls["to_email"] == "buyer@example.com"
    assert send_calls["attachments"] == ["pdf-attachment"]


def test_send_order_confirmation_without_pdf_attachment(monkeypatch):
    service = EmailService(_email_config())
    order = _order(order_items=[])

    monkeypatch.setattr(
        service, "_render_template", lambda *_args, **_kwargs: "<html>rendered</html>"
    )
    monkeypatch.setattr(service, "_generate_pdf", lambda _content, _name: None)

    captured = {}

    def fake_send_email(**kwargs):
        captured.update(kwargs)
        return {"success": False, "error": "delivery failed"}

    monkeypatch.setattr(service, "_send_email", fake_send_email)

    result = service.send_order_confirmation(order)

    assert result == {"success": False, "error": "delivery failed"}
    assert captured["attachments"] is None


def test_send_order_confirmation_handles_exception(monkeypatch):
    service = EmailService(_email_config())
    order = _order(order_items=[])

    def boom(*_args, **_kwargs):
        raise RuntimeError("template crash")

    monkeypatch.setattr(service, "_render_template", boom)

    result = service.send_order_confirmation(order)

    assert result["success"] is False
    assert "Failed to send order confirmation" in result["error"]


def test_send_payment_notification_returns_error_when_email_missing():
    service = EmailService(_email_config())
    payment = _payment(order=_order(address=None))
    result = service.send_payment_notification(payment)
    assert result == {"success": False, "error": "Order has no email address"}


def test_send_payment_notification_success_with_receipt_and_transaction(monkeypatch):
    service = EmailService(_email_config())
    payment = _payment(status="Failed", transaction_id="TX-99", mpesa_receipt="MPS-88")
    render_calls = []
    send_calls = {}

    def fake_render_template(*_args, **kwargs):
        render_calls.append(kwargs)
        return "<html>payment rendered</html>"

    monkeypatch.setattr(service, "_render_template", fake_render_template)
    monkeypatch.setattr(service, "_generate_pdf", lambda _content, _name: "receipt-pdf")

    def fake_send_email(**kwargs):
        send_calls.update(kwargs)
        return {"success": True}

    monkeypatch.setattr(service, "_send_email", fake_send_email)

    result = service.send_payment_notification(payment)

    assert result == {"success": True}
    assert len(render_calls) == 2
    assert send_calls["subject"] == "Payment Failed - Order #ORD-12345"
    assert send_calls["attachments"] == ["receipt-pdf"]


def test_send_payment_notification_handles_exception(monkeypatch):
    service = EmailService(_email_config())
    payment = _payment()

    monkeypatch.setattr(
        service,
        "_render_template",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(RuntimeError("boom")),
    )

    result = service.send_payment_notification(payment)

    assert result["success"] is False
    assert "Failed to send payment notification" in result["error"]


def test_send_shipment_update_returns_error_when_email_missing():
    service = EmailService(_email_config())
    order = _order(address=None)
    result = service.send_shipment_update(order, "Processing", "Shipped")
    assert result == {"success": False, "error": "Order has no email address"}


def test_send_shipment_update_success_for_shipped_status(monkeypatch):
    service = EmailService(_email_config())
    order = _order()
    send_calls = {}

    monkeypatch.setattr(service, "_render_template", lambda **_kwargs: "<html>shipment</html>")

    def fake_send_email(**kwargs):
        send_calls.update(kwargs)
        return {"success": True}

    monkeypatch.setattr(service, "_send_email", fake_send_email)

    result = service.send_shipment_update(order, "Processing", "Shipped")

    assert result == {"success": True}
    assert send_calls["subject"] == "Shipment Update for Order #ORD-12345"


def test_send_shipment_update_success_for_delivered_status(monkeypatch):
    service = EmailService(_email_config())
    order = _order()

    monkeypatch.setattr(service, "_render_template", lambda **_kwargs: "<html>shipment</html>")
    monkeypatch.setattr(
        service, "_send_email", lambda **_kwargs: {"success": False, "error": "smtp down"}
    )

    result = service.send_shipment_update(order, "Out for delivery", "Delivered")

    assert result == {"success": False, "error": "smtp down"}


def test_send_shipment_update_handles_exception(monkeypatch):
    service = EmailService(_email_config())
    order = _order()

    def boom(*_args, **_kwargs):
        raise RuntimeError("template failure")

    monkeypatch.setattr(service, "_render_template", boom)

    result = service.send_shipment_update(order, "Processing", "Shipped")

    assert result["success"] is False
    assert "Failed to send shipment update" in result["error"]


def test_send_review_request_returns_error_when_email_missing():
    service = EmailService(_email_config())
    order_item = _order_item_for_review(order=_order(address=None))
    result = service.send_review_request(order_item)
    assert result == {"success": False, "error": "Order has no email address"}


def test_send_review_request_success(monkeypatch):
    service = EmailService(_email_config())
    order_item = _order_item_for_review()
    send_calls = {}

    monkeypatch.setattr(service, "_render_template", lambda **_kwargs: "<html>review</html>")

    def fake_send_email(**kwargs):
        send_calls.update(kwargs)
        return {"success": True}

    monkeypatch.setattr(service, "_send_email", fake_send_email)

    result = service.send_review_request(order_item)

    assert result == {"success": True}
    assert send_calls["to_email"] == "buyer@example.com"
    assert send_calls["subject"] == "How was your Pixel 9?"


def test_send_review_request_handles_exception(monkeypatch):
    service = EmailService(_email_config())
    order_item = _order_item_for_review()

    def boom(*_args, **_kwargs):
        raise RuntimeError("template failure")

    monkeypatch.setattr(service, "_render_template", boom)

    result = service.send_review_request(order_item)

    assert result["success"] is False
    assert "Failed to send review request" in result["error"]
