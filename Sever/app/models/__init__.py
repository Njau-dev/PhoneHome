"""
Models package
Import all models here for easy access
"""

# User models
from .user import User, Admin, BlacklistToken

# Catalog models
from .category import Category, Brand, brand_categories

# Product models
from .product import Product, ProductVariation, Phone, Laptop, Tablet, Audio

# Shopping models
from .cart import Cart, CartItem
from .wishlist import WishList, Compare, CompareItem, wishlist_products

# Order models
from .order import Order, OrderItem, Address

# Payment models
from .payment import Payment

# Review models
from .review import Review

# Notification models
from .notification import Notification, AuditLog


# Export all models for easy importing
__all__ = [
    # User
    'User',
    'Admin',
    'BlacklistToken',

    # Catalog
    'Category',
    'Brand',
    'brand_categories',

    # Products
    'Product',
    'ProductVariation',
    'Phone',
    'Laptop',
    'Tablet',
    'Audio',

    # Shopping
    'Cart',
    'CartItem',
    'WishList',
    'Compare',
    'CompareItem',
    'wishlist_products',

    # Orders
    'Order',
    'OrderItem',
    'Address',

    # Payment
    'Payment',

    # Reviews
    'Review',

    # Notifications
    'Notification',
    'AuditLog',
]
