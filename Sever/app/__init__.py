"""
Application Factory Pattern
Creates and configures the Flask app
"""
from flask import Flask
from flask_cors import CORS
from app.extensions import db, migrate, jwt, api
from app.config import get_config


def create_app(config_name='development'):
    """
    Factory function to create Flask app

    Args:
        config_name: 'development', 'production', or 'testing'

    Returns:
        Configured Flask application
    """
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(get_config(config_name))

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app)

    # Register blueprints (we'll create these)
    register_blueprints(app)

    # Register error handlers
    register_error_handlers(app)

    # Setup JWT callbacks
    setup_jwt(app)

    return app


def register_blueprints(app):
    """Register all route blueprints"""
    from app.api.auth.routes import auth_bp
    from app.api.products.routes import products_bp
    from app.api.cart.routes import cart_bp
    from app.api.orders.routes import orders_bp
    from app.api.payments.routes import payments_bp
    from app.api.reviews.routes import reviews_bp
    from app.api.admin.routes import admin_bp
    from app.api.profile.routes import profile_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(cart_bp, url_prefix='/api/cart')
    app.register_blueprint(orders_bp, url_prefix='/api/orders')
    app.register_blueprint(payments_bp, url_prefix='/api/payments')
    app.register_blueprint(reviews_bp, url_prefix='/api/reviews')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(profile_bp, url_prefix='/api/profile')


def register_error_handlers(app):
    """Register custom error handlers"""
    from app.utils.exceptions import register_handlers
    register_handlers(app)


def setup_jwt(app):
    """Setup JWT callbacks"""
    from app.models.user import BlacklistToken

    @jwt.token_in_blocklist_loader
    def check_if_token_in_blacklist(jwt_header, jwt_payload):
        jti = jwt_payload['jti']
        return BlacklistToken.query.filter_by(token=jti).first() is not None
