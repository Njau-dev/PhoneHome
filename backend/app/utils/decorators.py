"""
Custom decorators for routes
"""
from functools import wraps

from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models import Admin


def admin_required(f):
    """
    Decorator to require admin privileges
    Must be used with @jwt_required()

    Usage:
        @jwt_required()
        @admin_required
        def admin_only_route():
            ...
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        admin = db.session.get(Admin, current_user_id)

        if not admin:
            return jsonify({"error": "Admin privileges required"}), 403

        return f(*args, **kwargs)

    return decorated_function


def validate_json(*required_fields):
    """
    Decorator to validate JSON request body has required fields

    Usage:
        @validate_json('email', 'password')
        def login():
            data = request.get_json()
            # email and password are guaranteed to exist
    """
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            if not request.is_json:
                return jsonify({"error": "Content-Type must be application/json"}), 400

            data = request.get_json()

            # Check for required fields
            missing_fields = [
                field for field in required_fields if not data.get(field)]

            if missing_fields:
                return jsonify({
                    "error": f"Missing required fields: {', '.join(missing_fields)}"
                }), 400

            return f(*args, **kwargs)

        return wrapped
    return decorator
