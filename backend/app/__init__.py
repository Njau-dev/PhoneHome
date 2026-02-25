"""
Application Factory
Creates and configures the Flask application
"""

import logging
import os
import time
from importlib import import_module
from pythonjsonlogger import jsonlogger

from flask import Flask, Response, request
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest

from app.config import get_config
from app.extensions import cors, db, jwt, migrate
from app.utils.jwt.callbacks import setup_jwt_callbacks

REQUEST_COUNT = Counter(
    "flask_http_request_total",
    "Total HTTP Requests",
    ["method", "endpoint", "http_status"],
)

REQUEST_LATENCY = Histogram(
    "flask_http_request_duration_seconds",
    "Request latency",
    ["endpoint"],
)


def create_app(config_name=None):
    """
    Factory function to create and configure Flask app

    Args:
        config_name: 'development', 'production', or None (auto-detect from env)

    Returns:
        Configured Flask application
    """
    app = Flask(__name__)

    # Avoid 308 redirects on missing/extra trailing slashes (helps CORS preflight)
    app.url_map.strict_slashes = False

    # Determine config
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    # Load configuration
    app.config.from_object(get_config(config_name))

    # Register logger and error handlers
    setup_logging(app)

    register_error_handlers(app)

    initialize_extensions(app)

    register_metrics(app)

    register_healthcheck(app)

    register_blueprints(app)

    setup_jwt_callbacks(jwt)

    # Import and register models (so migrations can see them)
    with app.app_context():
        import_module("app.models")

    app.logger.info(f"App created with config: {config_name}")

    return app


def register_metrics(app):
    """Register Prometheus metrics endpoint and request instrumentation."""

    @app.before_request
    def before_request():
        request.start_time = time.time()

    @app.after_request
    def after_request(response):
        start_time = getattr(request, "start_time", None)
        if start_time is None:
            return response

        endpoint = request.url_rule.rule if request.url_rule else request.path
        REQUEST_LATENCY.labels(endpoint=endpoint).observe(time.time() - start_time)
        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=endpoint,
            http_status=str(response.status_code),
        ).inc()
        return response

    @app.get("/metrics")
    def metrics():
        return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)


def register_healthcheck(app):
    """Register container/lb health endpoint."""

    @app.get("/health")
    def health():
        return {"status": "ok"}, 200


def register_blueprints(app):
    """Register all blueprints"""
    from app.api.admin.routes import admin_bp
    from app.api.auth.routes import auth_bp
    from app.api.brands.routes import brands_bp
    from app.api.cart.routes import cart_bp
    from app.api.categories.routes import categories_bp
    from app.api.compare.routes import compare_bp
    from app.api.home.routes import home_bp
    from app.api.notifications.routes import notifications_bp
    from app.api.orders.routes import orders_bp
    from app.api.payments.routes import payments_bp
    from app.api.products.routes import products_bp
    from app.api.profile.routes import profile_bp
    from app.api.reviews.routes import reviews_bp
    from app.api.wishlist.routes import wishlist_bp

    # Register auth blueprint
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(products_bp, url_prefix="/api/products")
    app.register_blueprint(categories_bp, url_prefix="/api/categories")
    app.register_blueprint(brands_bp, url_prefix="/api/brands")
    app.register_blueprint(cart_bp, url_prefix="/api/cart")
    app.register_blueprint(orders_bp, url_prefix="/api/orders")
    app.register_blueprint(payments_bp, url_prefix="/api/payments")
    app.register_blueprint(reviews_bp, url_prefix="/api/reviews")
    app.register_blueprint(profile_bp, url_prefix="/api/profile")
    app.register_blueprint(compare_bp, url_prefix="/api/compare")
    app.register_blueprint(wishlist_bp, url_prefix="/api/wishlist")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(home_bp, url_prefix="/api/home")

    app.logger.info("Blueprints registered")


def initialize_extensions(app):
    """Initialize Flask extensions"""
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app)

    # Configure Cloudinary
    with app.app_context():
        from app.services.cloudinary_service import CloudinaryService

        CloudinaryService.configure()

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
    if not os.path.exists("logs"):
        os.makedirs("logs")

    # Configure JSON logging format
    formatter = jsonlogger.JsonFormatter(
        "%(asctime)s %(levelname)s %(name)s %(message)s"
    )

    # File handler
    file_handler = logging.FileHandler("logs/app.log")
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
    gunicorn_logger = logging.getLogger("gunicorn.error")
    if gunicorn_logger.handlers:
        for handler in gunicorn_logger.handlers:
            handler.setFormatter(formatter)
        app.logger.handlers = gunicorn_logger.handlers
        app.logger.setLevel(gunicorn_logger.level)
