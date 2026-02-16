"""
Base configuration shared across all environments
"""

import os
from datetime import timedelta

from dotenv import load_dotenv


def load_environment():
    """Load environment variables based on current environment"""
    env = os.getenv('FLASK_ENV', 'development')

    # Load base .env file first
    if os.path.exists('.env'):
        load_dotenv('.env')

    # Load environment-specific .env file
    env_file = f'.env.{env}'
    if os.path.exists(env_file):
        load_dotenv(env_file, override=True)

    print(f"Environment: {env}")
    return env


# Load environment variables
ENVIRONMENT = load_environment()


class BaseConfig:
    """Base configuration class"""

    # Environment
    FLASK_ENV = ENVIRONMENT

    # Secret Keys
    SECRET_KEY = os.getenv('SECRET_KEY')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')

    # JWT Configuration
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv('SQLALCHEMY_DATABASE_URI')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False

    # Cloudinary
    CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME')
    CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY')
    CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET')

    # Email Configuration (Using Brevo/Sendinblue)
    BREVO_API_KEY = os.getenv('BREVO_API_KEY')
    BREVO_SENDER_EMAIL = os.getenv('BREVO_SENDER_EMAIL')
    BREVO_SENDER_NAME = os.getenv('BREVO_SENDER_NAME', 'Phone Home')

    # M-Pesa
    MPESA_CONSUMER_KEY = os.getenv('MPESA_CONSUMER_KEY')
    MPESA_CONSUMER_SECRET = os.getenv('MPESA_CONSUMER_SECRET')
    MPESA_BUSINESS_SHORTCODE = os.getenv('MPESA_BUSINESS_SHORTCODE')
    MPESA_PASSKEY = os.getenv('MPESA_PASSKEY')
    MPESA_ENVIRONMENT = os.getenv('MPESA_ENVIRONMENT', 'sandbox')
    MPESA_INITIATOR_NAME = os.getenv('MPESA_INITIATOR_NAME')
    MPESA_SECURITY_CREDENTIAL = os.getenv('MPESA_SECURITY_CREDENTIAL')

    # Application URLs
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:5000')

    # CORS Configuration
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', FRONTEND_URL)
    CORS_SUPPORTS_CREDENTIALS = True
    CORS_RESOURCES = {
        r"/*": {
            "origins": CORS_ORIGINS,
            "supports_credentials": CORS_SUPPORTS_CREDENTIALS
        }
    }

    # File Upload
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'avif', 'webp'}
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

    # Redis
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

    # Celery
    CELERY_BROKER_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    CELERY_RESULT_BACKEND = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

    # Password Reset
    PASSWORD_RESET_TIMEOUT = int(
        os.getenv('PASSWORD_RESET_TIMEOUT', 3600))  # 1 hour
    RESET_EMAIL_LIMIT = int(os.getenv('RESET_EMAIL_LIMIT', 3))
