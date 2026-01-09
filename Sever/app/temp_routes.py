"""
TEMPORARY FILE - Bridge to old routes
This file allows us to use the new app factory with old route code
We'll delete this once we refactor routes into blueprints
"""
from flask import request, jsonify, send_file, render_template_string
from flask_restful import Resource
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta, datetime, timezone
from functools import wraps
from collections import defaultdict
import traceback
import logging
import os
import re
from io import BytesIO
from xhtml2pdf import pisa
import cloudinary
import cloudinary.uploader
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db, api
from app.models import (
    User, Admin, BlacklistToken,
    Category, Brand,
    Product, Phone, Laptop, Tablet, Audio, ProductVariation,
    Cart, CartItem,
    WishList, Compare, CompareItem,
    Order, OrderItem, Address,
    Payment,
    Review,
    Notification, AuditLog
)

# Import your services (we'll keep these as-is for now)
from services.email_service import (
    serializer, send_password_reset_email,
    send_order_confirmation, send_payment_notification,
    send_shipment_update, send_review_request, send_email
)
from services.mpesa_service import mpesa_service

logger = logging.getLogger(__name__)


def register_old_routes(app):
    """
    Register all routes from old app.py
    This is temporary until we refactor into blueprints
    """

    # Configure Cloudinary
    cloudinary.config(
        cloud_name=app.config.get('CLOUDINARY_CLOUD_NAME'),
        api_key=app.config.get('CLOUDINARY_API_KEY'),
        api_secret=app.config.get('CLOUDINARY_API_SECRET'),
        debug=True,
        secure=True
    )

    # Helper functions
    def admin_required(f):
        @wraps(f)
        def decorator(*args, **kwargs):
            current_user_id = get_jwt_identity()
            admin = db.session.get(Admin, current_user_id)
            if not admin:
                return {"Error": "Admin privileges required"}, 403
            return f(*args, **kwargs)
        return decorator

    def allowed_file(filename):
        ALLOWED_EXTENSIONS = app.config.get('ALLOWED_EXTENSIONS')
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

    # Sync admin users function
    def sync_admin_users():
        try:
            admin_users = User.query.filter_by(role="admin").all()
            logger.info(f"Found {len(admin_users)} admin users to sync")

            for user in admin_users:
                existing_admin = Admin.query.filter_by(
                    email=user.email).first()

                if not existing_admin:
                    new_admin = Admin(
                        username=user.username,
                        email=user.email,
                        password_hash=user.password_hash
                    )

                    try:
                        db.session.add(new_admin)
                        db.session.flush()

                        audit_log = AuditLog(
                            admin_id=new_admin.id,
                            action=f"Admin account auto-created for user {user.username} (ID: {user.id})"
                        )
                        db.session.add(audit_log)

                        notification = Notification(
                            user_id=user.id,
                            message="Your admin account has been created.",
                            is_read=False
                        )
                        db.session.add(notification)

                        db.session.commit()
                        logger.info(
                            f"Created admin account for user {user.username}")

                    except SQLAlchemyError as e:
                        db.session.rollback()
                        logger.error(
                            f"Database error creating admin for user {user.id}: {str(e)}")
                        continue

        except Exception as e:
            logger.error(
                f"Error in sync_admin_users: {str(e)}\n{traceback.format_exc()}")

    # Run admin sync
    with app.app_context():
        try:
            sync_admin_users()
            logger.info("Successfully completed admin sync")
        except Exception as e:
            logger.error(f"Error in admin sync: {str(e)}")

    # TODO: Copy all your Resource classes from app.py here
    # For now, let's just add a simple test route

    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        return jsonify({
            "status": "healthy",
            "message": "Phone Home API is running",
            "environment": app.config.get('FLASK_ENV', 'unknown')
        }), 200

    @app.route('/api/test-db', methods=['GET'])
    def test_db():
        """Test database connection"""
        try:
            # Try to count users
            user_count = User.query.count()
            product_count = Product.query.count()

            return jsonify({
                "status": "success",
                "message": "Database connection successful",
                "data": {
                    "users": user_count,
                    "products": product_count
                }
            }), 200
        except Exception as e:
            return jsonify({
                "status": "error",
                "message": str(e)
            }), 500

    logger.info("Old routes registered (temporary bridge)")
