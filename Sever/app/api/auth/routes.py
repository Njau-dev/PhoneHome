"""
Authentication Routes Blueprint
Handles: signup, login, logout, password reset
"""
import logging
from datetime import timedelta, datetime, timezone
from flask import Blueprint, request, jsonify, Flask
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt
)
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer
from app.extensions import db
from app.models import User, Admin, BlacklistToken, Notification
from app.services.email_service import EmailService
import os
import re

logger = logging.getLogger(__name__)
app = Flask(__name__)

# Create blueprint
auth_bp = Blueprint('auth', __name__)

with app.app_context():
    serializer = URLSafeTimedSerializer(os.getenv('SECRET_KEY'))


# ============================================================================
# SIGNUP
# ============================================================================


@auth_bp.route('/signup', methods=['POST'])
def signup():
    """
    User registration endpoint

    Expected JSON:
    {
        "username": "john_doe",
        "email": "john@example.com",
        "phone_number": "+254712345678",
        "password": "securepassword123"
    }

    Returns:
        201: Success with token and user info
        400: Missing fields or validation error
        409: Email already exists
        500: Server error
    """
    try:
        data = request.get_json()

        # Validate required fields
        username = data.get('username')
        email = data.get('email')
        phone_number = data.get('phone_number')
        password = data.get('password')

        if not all([email, phone_number, password, username]):
            return jsonify({"error": "Missing required fields"}), 400

        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already exists"}), 409

        # Create new user
        hashed_password = generate_password_hash(password)
        new_user = User(
            username=username,
            email=email,
            phone_number=phone_number,
            password_hash=hashed_password
        )

        db.session.add(new_user)
        db.session.commit()

        # Create welcome notification
        notification = Notification(
            user_id=new_user.id,
            message="Your account has been created successfully.",
            is_read=False
        )
        db.session.add(notification)
        db.session.commit()

        # Generate token
        token = create_access_token(
            identity=str(new_user.id),
            expires_delta=timedelta(days=1)
        )

        logger.info(f"New user registered: {email}")

        return jsonify({
            "message": "Sign-Up Successful!",
            "token": token,
            "user": {
                "id": new_user.id,
                "username": new_user.username,
                "email": new_user.email
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error during signup: {str(e)}")
        return jsonify({"error": "Internal Server Error"}), 500


# ============================================================================
# LOGIN
# ============================================================================
@auth_bp.route('/login', methods=['POST'])
def login():
    """
    User login endpoint

    Expected JSON:
    {
        "email": "john@example.com",
        "password": "securepassword123"
    }

    Returns:
        200: Success with token and user info
        400: Missing credentials or invalid credentials
        500: Server error
    """
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        # Find user
        user = User.query.filter_by(email=email).first()

        # Verify credentials
        if user and check_password_hash(user.password_hash, password):
            token = create_access_token(
                identity=str(user.id),
                expires_delta=timedelta(days=1)
            )

            logger.info(f"User logged in: {email}")

            return jsonify({
                "message": "Login successful",
                "token": token,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role or "user"
                }
            }), 200
        else:
            return jsonify({"error": "Invalid Email or Password!"}), 400

    except Exception as e:
        logger.error(f"Error during login: {str(e)}")
        return jsonify({"error": "Internal Server Error"}), 500


# ============================================================================
# LOGOUT
# ============================================================================
@auth_bp.route('/logout', methods=['DELETE'])
@jwt_required()
def logout():
    """
    Logout endpoint - blacklists the current JWT token

    Requires: Valid JWT token in Authorization header

    Returns:
        200: Logout successful
        500: Server error
    """
    try:
        # Get the JWT ID from the token
        jti = get_jwt()['jti']

        # Check if the token already exists in the blacklist
        if BlacklistToken.query.filter_by(token=jti).first():
            return jsonify({"error": "Token already blacklisted"}), 400

        # Add token to blacklist
        blacklisted_token = BlacklistToken(token=jti)
        db.session.add(blacklisted_token)
        db.session.commit()

        logger.info("User logged out successfully")

        return jsonify({"message": "Logout Successful!"}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error during logout: {str(e)}")
        return jsonify({"error": "Internal Server Error"}), 500


# ============================================================================
# FORGOT PASSWORD
# ============================================================================
@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """
    Initiate password reset process

    Expected JSON:
    {
        "email": "john@example.com"
    }

    Returns:
        200: Reset email sent (or generic message)
        400: Missing email or invalid format
        500: Server error
    """
    try:
        email = request.json.get('email')

        if not email:
            return jsonify({"error": "Email is required"}), 400

        # Validate email format
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return jsonify({"error": "Invalid email format"}), 400

        user = User.query.filter_by(email=email).first()

        # Always return success to prevent email enumeration
        if not user:
            return jsonify({
                "message": "If that email exists, we've sent a reset link"
            }), 200

        try:
            # Generate reset token
            token = serializer.dumps(email, salt='password-reset')
            reset_url = f"{os.getenv('FRONTEND_URL')}/reset-password/{token}"
            logger.info(f"Password reset link: {reset_url}")
            logger.info(f"Email: {email}")

            # Save token to user
            user.reset_token = token
            user.reset_token_expiration = datetime.now(timezone.utc) + timedelta(
                seconds=int(os.getenv("PASSWORD_RESET_TIMEOUT", 3600))
            )
            db.session.commit()

            # Send reset email
            email_sent = EmailService.send_password_reset(
                EmailService, email, reset_url)

            if not email_sent:
                logger.error(f"Failed to send password reset email to {email}")
                return jsonify({"error": "Failed to send reset email"}), 500

            logger.info(f"Password reset email sent to: {email}")

            return jsonify({"message": "Password reset email sent"}), 200

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error in password reset process: {str(e)}")
            return jsonify({"error": "An error occurred processing your request"}), 500

    except Exception as e:
        logger.error(f"Unexpected error in forgot password: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500


# ============================================================================
# RESET PASSWORD
# ============================================================================
@auth_bp.route('/reset-password/<token>', methods=['POST'])
def reset_password(token):
    """
    Reset password with token

    Expected JSON:
    {
        "password": "newpassword123"
    }

    Returns:
        200: Password reset successful
        400: Missing password, invalid token, or token expired
        500: Server error
    """
    try:
        if not request.json or 'password' not in request.json:
            return jsonify({"error": "New password is required"}), 400

        new_password = request.json.get('password')

        # Validate password length
        if len(new_password) < 8:
            return jsonify({"error": "Password must be at least 8 characters long"}), 400

        try:
            # Verify token
            email = serializer.loads(
                token,
                salt='password-reset',
                max_age=int(os.getenv("PASSWORD_RESET_TIMEOUT", 3600))
            )
        except Exception:
            return jsonify({"error": "Invalid or expired token"}), 400

        # Find user with matching token
        user = User.query.filter_by(email=email, reset_token=token).first()
        if not user:
            return jsonify({"error": "Invalid reset request"}), 400

        # Check token expiration
        if user.reset_token_expiration < datetime.now(timezone.utc):
            return jsonify({"error": "Reset token has expired"}), 400

        try:
            # Update password
            user.password_hash = generate_password_hash(new_password)
            user.reset_token = None
            user.reset_token_expiration = None

            # Create notification
            notification = Notification(
                user_id=user.id,
                message="Your password has been reset successfully.",
                is_read=False
            )
            db.session.add(notification)
            db.session.commit()

            logger.info(f"Password reset successful for: {email}")

            return jsonify({"message": "Password reset successful"}), 200

        except Exception as e:
            db.session.rollback()
            logger.error(f"Database error during password reset: {str(e)}")
            return jsonify({"error": "Error updating password"}), 500

    except Exception as e:
        logger.error(f"Unexpected error in password reset: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500


# ============================================================================
# ADMIN LOGIN
# ============================================================================
@auth_bp.route('/admin/login', methods=['POST'])
def admin_login():
    """
    Admin login endpoint

    Expected JSON:
    {
        "email": "admin@example.com",
        "password": "adminpassword"
    }

    Returns:
        200: Success with token and admin info
        400: Missing credentials
        401: Invalid credentials
        500: Server error
    """
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        admin = Admin.query.filter_by(email=email).first()

        if admin and check_password_hash(admin.password_hash, password):
            # Create token with 2 hour expiration for admins
            access_token = create_access_token(
                identity=str(admin.id),
                expires_delta=timedelta(hours=2)
            )

            logger.info(f"Admin logged in: {email}")

            return jsonify({
                "message": "Login successful",
                "access_token": access_token,
                "user": {
                    "id": admin.id,
                    "name": admin.username,
                    "email": admin.email,
                    "role": "admin"
                }
            }), 200
        else:
            return jsonify({"error": "Invalid credentials!"}), 401

    except Exception as e:
        logger.error(f"Admin login error: {str(e)}")
        return jsonify({"error": "An error occurred during login"}), 500
