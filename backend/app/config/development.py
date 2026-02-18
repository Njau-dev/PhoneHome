"""Development-specific configuration"""

import os

from .base import BaseConfig, parse_cors_origins


class DevelopmentConfig(BaseConfig):
    """Development configuration"""

    DEBUG = True
    TESTING = False

    # Database
    # Show SQL queries in development
    SQLALCHEMY_ECHO = True

    # Security (less strict for development)
    SESSION_COOKIE_SECURE = False
    SESSION_COOKIE_HTTPONLY = False

    # Disable HTTPS in development
    PREFERRED_URL_SCHEME = "http"

    # Development CORS settings
    CORS_ORIGINS = parse_cors_origins(
        os.getenv("CORS_ORIGINS"), "http://localhost:3000,http://localhost:5173"
    )
    CORS_RESOURCES = {
        r"/*": {
            "origins": CORS_ORIGINS,
            "supports_credentials": BaseConfig.CORS_SUPPORTS_CREDENTIALS,
        }
    }
