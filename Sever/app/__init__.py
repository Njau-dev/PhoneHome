"""
Application Factory
Creates and configures the Flask application
"""
import os
import logging
from flask import Flask
from flask_cors import CORS

from app.config import get_config
from app.extensions import db, migrate, jwt, api, cors
from app.utils.jwt.callbacks import setup_jwt_callbacks


def create_app(config_name=None):
    """
    Factory function to create and configure Flask app

    Args:
        config_name: 'development', 'production', or None (auto-detect from env)

    Returns:
        Configured Flask application
    """
    # Create Flask app
    app = Flask(__name__)

    # Determine config
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    # Load configuration
    app.config.from_object(get_config(config_name))

    # Setup logging
    setup_logging(app)

    # Initialize extensions
    initialize_extensions(app)

    # Setup JWT
    setup_jwt_callbacks(app)

    # Register error handlers
    register_error_handlers(app)

    # Import and register models (so migrations can see them)
    with app.app_context():
        from app import models  # noqa: F401

    # Register routes (temporary - will be replaced with blueprints)
    register_routes(app)

    app.logger.info(f"App created with config: {config_name}")

    return app


def register_routes(app):
    """Register all routes"""
    # Register blueprints
    register_blueprints(app)

    # Temporary: Register old routes (will remove after full migration)
    from app.temp_routes import register_old_routes
    register_old_routes(app)

    app.logger.info("Routes registered")


def register_blueprints(app):
    """Register all blueprints"""
    from app.api.auth.routes import auth_bp

    # Register auth blueprint
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    app.logger.info("Blueprints registered")


def initialize_extensions(app):
    """Initialize Flask extensions"""
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    api.init_app(app)
    cors.init_app(app)

    app.logger.info("Extensions initialized")


def register_error_handlers(app):
    """Register custom error handlers"""

    @app.errorhandler(404)
    def not_found(error):
        return {"error": "Resource not found"}, 404

    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f"Internal error: {error}")
        return {"error": "Internal server error"}, 500

    @app.errorhandler(Exception)
    def handle_exception(error):
        app.logger.error(f"Unhandled exception: {error}")
        return {"error": "An unexpected error occurred"}, 500

    app.logger.info("Error handlers registered")


def setup_logging(app):
    """Configure logging"""
    # Create logs directory if it doesn't exist
    if not os.path.exists('logs'):
        os.makedirs('logs')

    # Configure logging format
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # File handler
    file_handler = logging.FileHandler('logs/app.log')
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.INFO)

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.INFO)

    # Add handlers to app logger
    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)
    app.logger.setLevel(logging.INFO)

    # Also configure Gunicorn logger if it exists
    gunicorn_logger = logging.getLogger('gunicorn.error')
    if gunicorn_logger.handlers:
        app.logger.handlers = gunicorn_logger.handlers
        app.logger.setLevel(gunicorn_logger.level)
