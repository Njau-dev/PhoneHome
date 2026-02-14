from app.extensions import db
from app.models import BlacklistToken
from app.utils.jwt.callbacks import is_token_blacklisted, setup_jwt_callbacks


class DummyJWT:
    def __init__(self):
        self.handlers = {}

    def token_in_blocklist_loader(self, fn):
        self.handlers["token_in_blocklist"] = fn
        return fn

    def expired_token_loader(self, fn):
        self.handlers["expired_token"] = fn
        return fn

    def invalid_token_loader(self, fn):
        self.handlers["invalid_token"] = fn
        return fn

    def unauthorized_loader(self, fn):
        self.handlers["unauthorized"] = fn
        return fn

    def revoked_token_loader(self, fn):
        self.handlers["revoked_token"] = fn
        return fn


def test_is_token_blacklisted_returns_false_for_unknown_token(app, db):
    with app.app_context():
        assert is_token_blacklisted({"jti": "missing-token"}) is False


def test_is_token_blacklisted_returns_true_for_existing_token(app, db):
    with app.app_context():
        db.session.add(BlacklistToken(token="known-token"))
        db.session.commit()

        assert is_token_blacklisted({"jti": "known-token"}) is True


def test_setup_jwt_callbacks_registers_handlers_and_expected_responses(app, db):
    jwt = DummyJWT()

    with app.app_context():
        setup_jwt_callbacks(jwt)

        assert set(jwt.handlers.keys()) == {
            "token_in_blocklist",
            "expired_token",
            "invalid_token",
            "unauthorized",
            "revoked_token",
        }

        expired_payload, expired_status = jwt.handlers["expired_token"]({}, {})
        assert expired_status == 401
        assert expired_payload["error"] == "Token expired"

        invalid_payload, invalid_status = jwt.handlers["invalid_token"]("bad token")
        assert invalid_status == 401
        assert invalid_payload["error"] == "Invalid token"

        missing_payload, missing_status = jwt.handlers["unauthorized"]("missing token")
        assert missing_status == 401
        assert missing_payload["error"] == "Authorization required"

        revoked_payload, revoked_status = jwt.handlers["revoked_token"]({}, {})
        assert revoked_status == 401
        assert revoked_payload["error"] == "Token revoked"


def test_blacklist_loader_callback_uses_blacklist_lookup(app, db):
    jwt = DummyJWT()

    with app.app_context():
        setup_jwt_callbacks(jwt)
        db.session.add(BlacklistToken(token="jti-001"))
        db.session.commit()

        callback = jwt.handlers["token_in_blocklist"]
        assert callback({}, {"jti": "jti-001"}) is True
        assert callback({}, {"jti": "jti-002"}) is False
