"""Production-specific configuration"""
import os
from .base import BaseConfig


class ProductionConfig(BaseConfig):
    """Production configuration"""
    DEBUG = False
    TESTING = False

    # Security (strict settings for production)
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'

    # Enable HTTPS in production
    PREFERRED_URL_SCHEME = 'https'

    # Production optimizations
    SQLALCHEMY_ECHO = False
    SQLALCHEMY_POOL_SIZE = 20
    SQLALCHEMY_MAX_OVERFLOW = 30

    # Cache settings
    CACHE_TYPE = 'redis'
    CACHE_REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

    # Production CORS settings
    CORS_ORIGINS = os.getenv(
        'CORS_ORIGINS', 'https://your-frontend.com,https://www.your-frontend.com')
