"""
Models package
Import all models here for easy access
"""

# User models
# Shopping models
from .cart import Cart, CartItem

# Catalog models
from .category import Brand, Category, brand_categories

# Notification models
from .notification import AuditLog, Notification

# Order models
from .order import Address, Order, OrderItem

# Payment models
from .payment import Payment

# Product models
from .product import Audio, Laptop, Phone, Product, ProductVariation, Tablet

# Review models
from .review import Review
from .user import BlacklistToken, User
from .wishlist import Compare, CompareItem, WishList, wishlist_products

# Export all models for easy importing
__all__ = [
    # User
    "User",
    "BlacklistToken",
    # Catalog
    "Category",
    "Brand",
    "brand_categories",
    # Products
    "Product",
    "ProductVariation",
    "Phone",
    "Laptop",
    "Tablet",
    "Audio",
    # Shopping
    "Cart",
    "CartItem",
    "WishList",
    "Compare",
    "CompareItem",
    "wishlist_products",
    # Orders
    "Order",
    "OrderItem",
    "Address",
    # Payment
    "Payment",
    # Reviews
    "Review",
    # Notifications
    "Notification",
    "AuditLog",
]
