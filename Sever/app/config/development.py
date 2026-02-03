"""Development-specific configuration"""
from .base import BaseConfig
import os


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
    PREFERRED_URL_SCHEME = 'http'

    # Development CORS settings
    CORS_ORIGINS = os.getenv(
        'CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000')
