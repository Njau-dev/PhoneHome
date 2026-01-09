"""
Services Package
Business logic layer
"""

# Import services for easy access
from app.services.notification_service import NotificationService, create_notification
from app.services.cloudinary_service import CloudinaryService, upload_image, upload_images
from app.services.product_service import ProductService
from app.services.cart_service import CartService
from app.services.order_service import OrderService

# Keep existing services
from app.services.email_service import EmailService
from app.services.mpesa_service import MpesaService

__all__ = [
    # New services
    'NotificationService',
    'create_notification',
    'CloudinaryService',
    'upload_image',
    'upload_images',
    'ProductService',
    'CartService',
    'OrderService',

    # Existing services
    'EmailService',
    'MpesaService',
]
