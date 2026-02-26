"""
Sentry setup and request user-context helpers.
"""

import logging
import os
from typing import Any

import sentry_sdk
from flask import Flask
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from sentry_sdk.integrations.flask import FlaskIntegration

logger = logging.getLogger(__name__)

_SENTRY_INITIALIZED = False


def _env_float(name: str, default: float) -> float:
    """Read a float environment variable with fallback."""
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        logger.warning("Invalid %s=%r. Falling back to %s", name, value, default)
        return default


def _env_bool(name: str, default: bool) -> bool:
    """Read a boolean environment variable with fallback."""
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def initialize_sentry() -> bool:
    """Initialize Sentry once per process if DSN is configured."""
    global _SENTRY_INITIALIZED
    if _SENTRY_INITIALIZED:
        return True

    dsn = os.getenv("SENTRY_DSN")
    if not dsn:
        logger.info("Sentry disabled: SENTRY_DSN is not set")
        return False

    try:
        sentry_sdk.init(
            dsn=dsn,
            integrations=[FlaskIntegration()],
            traces_sample_rate=_env_float("SENTRY_TRACES_SAMPLE_RATE", 1.0),
            environment=os.getenv("FLASK_ENV", "development"),
            send_default_pii=_env_bool("SENTRY_SEND_DEFAULT_PII", True),
            release=os.getenv("SENTRY_RELEASE"),
            enable_logs=_env_bool("SENTRY_ENABLE_LOGS", True),
        )
    except Exception as exc:
        logger.exception("Failed to initialize Sentry: %s", exc)
        return False

    _SENTRY_INITIALIZED = True
    logger.info("Sentry initialized")
    return True


def clear_sentry_user() -> None:
    """Clear any user bound to the current Sentry scope."""
    sentry_sdk.set_user(None)


def set_sentry_user(user: Any) -> None:
    """Set Sentry user context from a user-like object."""
    user_id = getattr(user, "id", None)
    if user_id is None:
        return

    payload = {"id": str(user_id)}
    email = getattr(user, "email", None)
    username = getattr(user, "username", None)
    role = getattr(user, "role", None)

    if email:
        payload["email"] = email
    if username:
        payload["username"] = username
    if role:
        payload["role"] = role

    sentry_sdk.set_user(payload)


def set_sentry_user_from_claims(claims: dict[str, Any] | None) -> None:
    """Set Sentry user context from JWT claims."""
    if not claims:
        return

    user_id = claims.get("sub")
    if user_id is None:
        return

    payload = {"id": str(user_id)}
    for field in ("email", "username", "role"):
        value = claims.get(field)
        if value:
            payload[field] = value

    sentry_sdk.set_user(payload)


def register_sentry_user_context(app: Flask) -> None:
    """
    Bind Sentry user context per request from JWT claims.

    This is best effort and never blocks request handling.
    """

    @app.before_request
    def _bind_user_from_jwt() -> None:
        clear_sentry_user()

        try:
            verification_result = verify_jwt_in_request(optional=True, skip_revocation_check=True)
        except Exception:
            return

        # For exempt methods (e.g. OPTIONS) and optional requests with no token,
        # flask-jwt-extended returns None and may not set request JWT context.
        if verification_result is None:
            return

        set_sentry_user_from_claims(get_jwt())
