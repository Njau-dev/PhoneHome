"""
Wishlist and Compare models
"""
from datetime import datetime

from app.extensions import db

# Association table for WishList and Product many-to-many
wishlist_products = db.Table('wishlist_products',
                             db.Column('wishlist_id', db.Integer, db.ForeignKey(
                                 'wishlists.id'), primary_key=True),
                             db.Column('product_id', db.Integer, db.ForeignKey(
                                 'products.id'), primary_key=True),
                             db.Column('created_at', db.DateTime,
                                       default=datetime.utcnow)
                             )


class WishList(db.Model):
    """User wishlist model"""
    __tablename__ = 'wishlists'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Many-to-many relationship with products
    products = db.relationship('Product',
                               secondary=wishlist_products,
                               backref=db.backref('wishlists', lazy='dynamic'))

    def __repr__(self):
        return f'<WishList user_id={self.user_id}>'


class Compare(db.Model):
    """Product comparison list (max 3 items, auto-expires after 24hrs)"""
    __tablename__ = 'compares'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    items = db.relationship('CompareItem', backref='compare', lazy=True,
                            cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Compare user_id={self.user_id}>'


class CompareItem(db.Model):
    """Individual items in comparison list"""
    __tablename__ = 'compare_items'

    id = db.Column(db.Integer, primary_key=True)
    compare_id = db.Column(db.Integer, db.ForeignKey(
        'compares.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey(
        'products.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    product = db.relationship('Product', backref='compare_items', lazy=True)

    def __repr__(self):
        return f'<CompareItem product_id={self.product_id}>'
