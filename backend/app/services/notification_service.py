"""
Notification Service
Handles creating and managing user notifications
"""
import logging

from app.extensions import db
from app.models import Notification

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for managing user notifications"""

    @staticmethod
    def create_notification(user_id, message):
        """
        Create a new notification for a user

        Args:
            user_id: ID of the user
            message: Notification message

        Returns:
            Notification object or None if failed
        """
        try:
            notification = Notification(
                user_id=user_id,
                message=message,
                is_read=False
            )
            db.session.add(notification)
            db.session.commit()

            logger.info(
                f"Notification created for user {user_id}: {message[:50]}")
            return notification

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating notification: {str(e)}")
            return None

    @staticmethod
    def get_user_notifications(user_id, unread_only=False):
        """
        Get all notifications for a user

        Args:
            user_id: ID of the user
            unread_only: If True, only return unread notifications

        Returns:
            List of notification dictionaries
        """
        try:
            query = Notification.query.filter_by(user_id=user_id)

            if unread_only:
                query = query.filter_by(is_read=False)

            notifications = query.order_by(
                Notification.created_at.desc()).all()

            return [
                {
                    "id": n.id,
                    "message": n.message,
                    "is_read": n.is_read,
                    "created_at": n.created_at.isoformat()
                }
                for n in notifications
            ]

        except Exception as e:
            logger.error(f"Error fetching notifications: {str(e)}")
            return []

    @staticmethod
    def mark_as_read(notification_id, user_id):
        """
        Mark a notification as read

        Args:
            notification_id: ID of the notification
            user_id: ID of the user (for security check)

        Returns:
            True if successful, False otherwise
        """
        try:
            notification = Notification.query.filter_by(
                id=notification_id,
                user_id=user_id
            ).first()

            if not notification:
                return False

            notification.is_read = True
            db.session.commit()

            logger.info(f"Notification {notification_id} marked as read")
            return True

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error marking notification as read: {str(e)}")
            return False

    @staticmethod
    def mark_all_as_read(user_id):
        """
        Mark all notifications as read for a user

        Args:
            user_id: ID of the user

        Returns:
            Number of notifications marked as read
        """
        try:
            count = Notification.query.filter_by(
                user_id=user_id,
                is_read=False
            ).update({"is_read": True})

            db.session.commit()

            logger.info(
                f"Marked {count} notifications as read for user {user_id}")
            return count

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error marking all notifications as read: {str(e)}")
            return 0


# Convenience function for easy import
def create_notification(user_id, message):
    """Shorthand for creating notifications"""
    return NotificationService.create_notification(user_id, message)
