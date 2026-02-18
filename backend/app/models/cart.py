"""
Shopping cart models
"""

from datetime import datetime

from app.extensions import db


class Cart(db.Model):
    """Shopping cart model - one cart per user"""

    __tablename__ = "carts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    items = db.relationship("CartItem", backref="cart", lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Cart user_id={self.user_id}>"


class CartItem(db.Model):
    """Individual items in a cart"""

    __tablename__ = "cart_items"

    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.Integer, db.ForeignKey("carts.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    variation_name = db.Column(db.String(255), nullable=True)  # e.g., "8GB - 256GB"
    variation_price = db.Column(db.Integer, nullable=True)

    # Relationships
    product = db.relationship("Product", backref="cart_items", lazy="joined")

    def __repr__(self):
        return f"<CartItem product_id={self.product_id} qty={self.quantity}>"
