"""Development-specific configuration"""
from .base import BaseConfig


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

    # Development-specific settings
    SERVER_NAME = 'localhost:5000'
    APPLICATION_ROOT = '/'
