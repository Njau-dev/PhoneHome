"""
User, Admin, and authentication related models
"""
from datetime import datetime

from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db


class User(db.Model):
    """User model for customers"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone_number = db.Column(db.String(15), nullable=False)
    address = db.Column(db.String(255), nullable=True)
    password_hash = db.Column(db.String(450), nullable=False)
    role = db.Column(db.String(50), default='user')
    reset_token = db.Column(db.String(256))
    reset_token_expiration = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships (we'll define these properly when we create related models)
    # Using lazy='dynamic' for now - we'll optimize later
    orders = db.relationship('Order', backref='user',
                             lazy=True, cascade="all, delete-orphan")
    cart = db.relationship('Cart', uselist=False, backref='user', lazy=True)
    reviews = db.relationship('Review', backref='user',
                              lazy=True, cascade="all, delete-orphan")
    wishlist_items = db.relationship(
        'WishList', backref='user', lazy=True, cascade="all, delete-orphan")
    notifications = db.relationship(
        'Notification', backref='user', lazy=True, cascade="all, delete-orphan")
    addresses = db.relationship(
        'Address', backref='user', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verify password"""
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'


class Admin(db.Model):
    """Admin model for administrative users"""
    __tablename__ = 'admins'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True,
                         nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(450), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    audit_logs = db.relationship(
        'AuditLog', backref='admin', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verify password"""
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<Admin {self.username}>'


class BlacklistToken(db.Model):
    """Token blacklist for logout functionality"""
    __tablename__ = 'blacklist_token'

    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(500), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<BlacklistToken {self.token[:20]}...>'
