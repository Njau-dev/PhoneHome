from flask import Flask, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required

from app.extensions import db
from app.models import User
from app.utils.decorators import admin_required, validate_json


def _create_test_app():
    app = Flask(__name__)
    app.config.update(
        TESTING=True,
        SQLALCHEMY_DATABASE_URI="sqlite:///:memory:",
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        JWT_SECRET_KEY="test-secret",
    )
    db.init_app(app)
    JWTManager(app)

    @app.route("/admin-only")
    @jwt_required()
    @admin_required
    def admin_only():
        return jsonify({"ok": True}), 200

    @app.route("/validate", methods=["POST"])
    @validate_json("email", "password")
    def validate_route():
        return jsonify({"ok": True}), 200

    with app.app_context():
        db.create_all()

    return app


def test_validate_json_happy_path():
    app = _create_test_app()

    with app.test_client() as client:
        response = client.post("/validate", json={"email": "a@b.com", "password": "secret"})

    assert response.status_code == 200
    assert response.get_json()["ok"] is True


def test_validate_json_missing_fields_error():
    app = _create_test_app()

    with app.test_client() as client:
        response = client.post("/validate", json={"email": "a@b.com"})

    assert response.status_code == 400
    assert "Missing required fields" in response.get_json()["error"]


def test_admin_required_rejects_non_admin_token():
    app = _create_test_app()

    with app.app_context():
        token = create_access_token(identity="1")

    with app.test_client() as client:
        response = client.get("/admin-only", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 403
    assert response.get_json()["error"] == "Admin privileges required"


def test_admin_required_allows_admin_token():
    app = _create_test_app()

    with app.app_context():
        admin = User(
            id=1,
            username="admin",
            email="admin@test.com",
            phone_number="0712345678",
            password_hash="hashed",
            role="admin",
        )
        db.session.add(admin)
        db.session.commit()
        token = create_access_token(identity="1")

    with app.test_client() as client:
        response = client.get("/admin-only", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.get_json()["ok"] is True
