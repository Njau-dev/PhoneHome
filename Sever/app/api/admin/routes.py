"""
Admin Routes Blueprint
Handles: admin operations - user management, notification sending, audit logs
"""
import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import User, Notification, AuditLog
from app.utils.decorators import admin_required
from app.utils.response_formatter import format_response

logger = logging.getLogger(__name__)

# Create blueprint
admin_bp = Blueprint('admin', __name__)


# ============================================================================
# GET ALL USERS
# ============================================================================
@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@admin_required
def get_all_users():
    """
    Get all users (admin only)

    Returns:
        200: List of users
        500: Server error
    """
    try:
        users = User.query.all()
        users_data = [{
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_admin": user.is_admin
        } for user in users]

        return jsonify(format_response(True, {"users": users_data}, "Users fetched successfully")), 200

    except Exception as e:
        logger.error(f"Error fetching users: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while fetching users")), 500


# ===========================================================================
# UPDATE USER ROLE TO ADMIN
# ============================================================================
@admin_bp.route('/users/<int:user_id>/promote', methods=['PUT'])
@jwt_required()
@admin_required
def promote_user_to_admin(user_id):
    """
    Promote a user to admin (admin only)

    Args:
        user_id: ID of the user to promote

    Returns:
        200: User promoted
        404: User not found
        500: Server error
    """
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify(format_response(False, None, "User not found")), 404

        user.is_admin = True
        db.session.commit()

        # Log the admin action
        current_admin_id = get_jwt_identity()
        log_admin_action(current_admin_id, f"Promoted user {user_id} to admin")

        return jsonify(format_response(True, None, f"User {user_id} promoted to admin")), 200

    except Exception as e:
        logger.error(f"Error promoting user to admin: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while promoting user")), 500


# ===========================================================================
# DELETE USER
# ============================================================================
@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(user_id):
    """
    Delete a user (admin only)

    Args:
        user_id: ID of the user to delete

    Returns:
        200: User deleted
        404: User not found
        500: Server error
    """
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify(format_response(False, None, "User not found")), 404

        db.session.delete(user)
        db.session.commit()

        # Log the admin action
        current_admin_id = get_jwt_identity()
        log_admin_action(current_admin_id, f"Deleted user {user_id}")

        return jsonify(format_response(True, None, f"User {user_id} deleted")), 200

    except Exception as e:
        logger.error(f"Error deleting user: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while deleting user")), 500


# ============================================================================
# SEND NOTIFICATION TO USER
# ============================================================================
@admin_bp.route('/notifications', methods=['POST'])
@jwt_required()
@admin_required
def send_notification():
    """
    Send a notification to a user (admin only)

    Request JSON:
        user_id: ID of the user to notify
        message: Notification message

    Returns:
        201: Notification sent
        400: Bad request
        500: Server error
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        message = data.get('message')

        if not user_id or not message:
            return jsonify(format_response(False, None, "user_id and message are required")), 400

        notification = Notification(user_id=user_id, message=message)
        db.session.add(notification)
        db.session.commit()

        return jsonify(format_response(True, None, "Notification sent")), 201

    except Exception as e:
        logger.error(f"Error sending notification: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while sending notification")), 500


# ============================================================================
# GET AUDIT LOGS
# ============================================================================
@admin_bp.route('/audit-logs', methods=['GET'])
@jwt_required()
@admin_required
def get_audit_logs():
    """
    Get audit logs (admin only)

    Returns:
        200: List of audit logs
        500: Server error
    """
    try:
        logs = AuditLog.query.order_by(AuditLog.created_at.desc()).all()
        logs_data = [{
            "id": log.id,
            "action": log.action,
            "performed_by": log.admin_id,
            "timestamp": log.created_at.isoformat()
        } for log in logs]

        return jsonify(format_response(True, {"audit_logs": logs_data}, "Audit logs fetched successfully")), 200

    except Exception as e:
        logger.error(f"Error fetching audit logs: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while fetching audit logs")), 500


# ============================================================================
# LOG ADMIN ACTION
# ============================================================================
def log_admin_action(admin_id, action):
    """
    Log an admin action

    Args:
        admin_id: ID of the admin performing the action
        action: Description of the action
    """
    try:
        audit_log = AuditLog(admin_id=admin_id, action=action)
        db.session.add(audit_log)
        db.session.commit()

    except Exception as e:
        logger.error(f"Error logging admin action: {str(e)}")
