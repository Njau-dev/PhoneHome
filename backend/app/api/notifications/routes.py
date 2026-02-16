"""
Notifications Routes Blueprint
Handles: user notifications
"""

import logging

from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models import Notification
from app.utils.response_formatter import format_response

logger = logging.getLogger(__name__)

# Create blueprint
notifications_bp = Blueprint('notifications', __name__)


# ============================================================================
# GET USER NOTIFICATIONS
# ============================================================================
@notifications_bp.route('/user', methods=['GET'])
@jwt_required()
def get_user_notifications():
    """
    Get notifications for the logged-in user

    Returns:
        200: List of notifications
        500: Server error
    """
    try:
        user_id = get_jwt_identity()
        notifications = Notification.query.filter_by(user_id=user_id).all()
        notifications_data = [{
            "id": notif.id,
            "message": notif.message,
            "is_read": notif.is_read,
            "created_at": notif.created_at.isoformat()
        } for notif in notifications]

        return jsonify(format_response(True, {"notifications": notifications_data}, "Notifications fetched successfully")), 200

    except Exception as e:
        logger.error(f"Error fetching notifications: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while fetching notifications")), 500


# ============================================================================
# MARK NOTIFICATION AS READ
# ============================================================================
@notifications_bp.route('/user/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_as_read(notification_id):
    """
    Mark a notification as read for the logged-in user

    Returns:
        200: Notification marked as read
        404: Notification not found
        500: Server error
    """
    try:
        user_id = get_jwt_identity()
        notification = Notification.query.filter_by(
            id=notification_id, user_id=user_id).first()

        if not notification:
            return jsonify(format_response(False, None, "Notification not found")), 404

        notification.is_read = True
        db.session.commit()

        return jsonify(format_response(True, {"message": "Notification marked as read"}, "Notification marked as read")), 200

    except Exception as e:
        logger.error(f"Error marking notification as read: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while marking notification as read")), 500
