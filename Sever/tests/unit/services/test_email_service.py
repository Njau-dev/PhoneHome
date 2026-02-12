import logging
import os

os.environ.setdefault("SECRET_KEY", "test-secret")

from app import create_app

_test_app = create_app("testing")
_test_ctx = _test_app.app_context()
_test_ctx.push()

from app.services.email_service import EmailService


class DummyApi:
    def __init__(self):
        self.sent_payload = None

    def send_transac_email(self, payload):
        self.sent_payload = payload



def _email_config():
    return {
        "BREVO_API_KEY": "brevo-test-key",
        "SECRET_KEY": "secret",
        "BREVO_SENDER_EMAIL": "sender@example.com",
        "BREVO_SENDER_NAME": "Phone Home",
    }



def test_send_email_success_maps_response(monkeypatch):
    service = EmailService(_email_config())
    api = DummyApi()

    monkeypatch.setattr("app.services.email_service.TransactionalEmailsApi", lambda client: api)
    monkeypatch.setattr("app.services.email_service.ApiClient", lambda config: object())

    result = service._send_email("to@example.com", "Subject", "<p>Body</p>")

    assert result == {"success": True}
    assert api.sent_payload.subject == "Subject"



def test_send_email_exception_is_mapped_and_logged(monkeypatch, caplog):
    service = EmailService(_email_config())

    class ExplodingApi:
        def __init__(self, *_args, **_kwargs):
            pass

        def send_transac_email(self, _payload):
            raise RuntimeError("transient sdk failure")

    monkeypatch.setattr("app.services.email_service.ApiClient", lambda config: object())
    monkeypatch.setattr("app.services.email_service.TransactionalEmailsApi", ExplodingApi)

    with caplog.at_level(logging.ERROR):
        result = service._send_email("to@example.com", "Subject", "<p>Body</p>")

    assert result["success"] is False
    assert "Failed to send email" in result["error"]
    assert "Failed to send email to to@example.com" in caplog.text



def test_send_password_reset_handles_template_render_errors(monkeypatch):
    service = EmailService(_email_config())

    def boom(*_args, **_kwargs):
        raise ValueError("malformed template")

    monkeypatch.setattr(service, "_render_template", boom)

    result = service.send_password_reset("user@example.com", "http://example.com/reset")

    assert result["success"] is False
    assert "Failed to send password reset email" in result["error"]
