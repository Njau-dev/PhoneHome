"""Testing-specific configuration"""

from sqlalchemy.pool import StaticPool

from .base import BaseConfig


class TestingConfig(BaseConfig):
    """Testing configuration"""

    TESTING = True
    DEBUG = False
    WTF_CSRF_ENABLED = False

    # Use in-memory SQLite with a static pool so connections share state.
    SQLALCHEMY_DATABASE_URI = "sqlite://"
    SQLALCHEMY_ENGINE_OPTIONS = {
        "connect_args": {"check_same_thread": False},
        "poolclass": StaticPool,
    }
    SQLALCHEMY_ECHO = False

    # Deterministic secrets for tests
    SECRET_KEY = "test-secret-key"
    JWT_SECRET_KEY = "test-jwt-secret-key"
