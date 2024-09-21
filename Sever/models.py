from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash


db = SQLAlchemy()

# User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)  
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone_number = db.Column(db.String(15), unique=True, nullable=False)
    address = db.Column(db.String(255), nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    orders = db.relationship('Order', backref='user', lazy=True)
    cart = db.relationship('Cart', uselist=False, backref='user', lazy=True)
    reviews = db.relationship('Review', backref='user', lazy=True)
    wishlist_items = db.relationship('WishList', backref='user', lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Admin model
class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False) 
    password_hash = db.Column(db.String(128), nullable=False)
    audit_logs = db.relationship('AuditLog', backref='admin', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Category model
class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    phones = db.relationship('Phone', backref='category', lazy=True)
    tablet = db.relationship('Tablet', backref='category', lazy=True)
    laptop = db.relationship('Laptop', backref='category', lazy=True)
    audio = db.relationship('Audio', backref='category', lazy=True)

# Brand model
class Brand(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    phones = db.relationship('Phone', backref='brand', lazy=True)
    tablet = db.relationship('Tablet', backref='brand', lazy=True)
    laptop = db.relationship('Laptop', backref='brand', lazy=True)
    audio = db.relationship('Audio', backref='brand', lazy=True)


# Phone model
class Phone(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=False)
    image_urls = db.Column(db.JSON, nullable=False)  # Store as a JSON array
    ram = db.Column(db.String(20), nullable=False)
    storage = db.Column(db.String(20), nullable=False)
    battery = db.Column(db.String(50), nullable=False)
    main_camera = db.Column(db.String(100), nullable=False)
    front_camera = db.Column(db.String(100), nullable=False)
    display = db.Column(db.String(100), nullable=False)
    processor = db.Column(db.String(100), nullable=False)
    connectivity = db.Column(db.String(100), nullable=False)
    colors = db.Column(db.String(100), nullable=False)  # Store as a comma-separated string
    os = db.Column(db.String(50), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    brand_id = db.Column(db.Integer, db.ForeignKey('brand.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    cart_items = db.relationship('CartItem', backref='phone', lazy=True)
    order_items = db.relationship('OrderItem', backref='phone', lazy=True)
    reviews = db.relationship('Review', backref='phone', lazy=True)
    wishlist_items = db.relationship('WishList', backref='phone', lazy=True)


class Tablet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=False)
    image_urls = db.Column(db.JSON, nullable=False)  # Store as a JSON array
    ram = db.Column(db.String(20), nullable=False)
    storage = db.Column(db.String(20), nullable=False)
    battery = db.Column(db.String(50), nullable=False)
    main_camera = db.Column(db.String(100), nullable=False)
    front_camera = db.Column(db.String(100), nullable=False)
    display = db.Column(db.String(100), nullable=False)
    processor = db.Column(db.String(100), nullable=False)
    connectivity = db.Column(db.String(100), nullable=False)
    colors = db.Column(db.String(100), nullable=False)  # Store as a comma-separated string
    os = db.Column(db.String(50), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    brand_id = db.Column(db.Integer, db.ForeignKey('brand.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    cart_items = db.relationship('CartItem', backref='tablet', lazy=True)
    order_items = db.relationship('OrderItem', backref='tablet', lazy=True)
    reviews = db.relationship('Review', backref='tablet', lazy=True)
    wishlist_items = db.relationship('WishList', backref='tablet', lazy=True)

class Laptop(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=False)
    image_urls = db.Column(db.JSON, nullable=False)  # Store as a JSON array  
    ram = db.Column(db.String(20), nullable=False)
    storage = db.Column(db.String(20), nullable=False)
    battery = db.Column(db.String(50), nullable=False)
    display = db.Column(db.String(100), nullable=False)
    processor = db.Column(db.String(100), nullable=False)
    os = db.Column(db.String(50), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    brand_id = db.Column(db.Integer, db.ForeignKey('brand.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    cart_items = db.relationship('CartItem', backref='laptop', lazy=True)
    order_items = db.relationship('OrderItem', backref='laptop', lazy=True)
    reviews = db.relationship('Review', backref='laptop', lazy=True)
    wishlist_items = db.relationship('WishList', backref='laptop', lazy=True)

class Audio(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=False)
    image_urls = db.Column(db.JSON, nullable=False)  # Store as a JSON array
    battery = db.Column(db.String(50), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    brand_id = db.Column(db.Integer, db.ForeignKey('brand.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    cart_items = db.relationship('CartItem', backref='audio', lazy=True)
    order_items = db.relationship('OrderItem', backref='audio', lazy=True)
    reviews = db.relationship('Review', backref='audio', lazy=True)
    wishlist_items = db.relationship('WishList', backref='audio', lazy=True)


# Cart model
class Cart(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    items = db.relationship('CartItem', backref='cart', lazy=True)

# CartItem model
class CartItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.Integer, db.ForeignKey('cart.id'), nullable=False)
    phone_id = db.Column(db.Integer, db.ForeignKey('phone.id'), nullable=True)
    laptop_id = db.Column(db.Integer, db.ForeignKey('laptop.id'), nullable=True)
    audio_id = db.Column(db.Integer, db.ForeignKey('audio.id'), nullable=True)
    tablets_id = db.Column(db.Integer, db.ForeignKey('tablet.id'), nullable=True)
    quantity = db.Column(db.Integer, nullable=False, default=1)

class Sales(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_type = db.Column(db.String(50), nullable=False)  # Can be 'phone', 'laptop', 'audio', 'tablet', etc.
    product_id = db.Column(db.Integer, nullable=False)  # The ID of the product (foreign key not needed here)
    quantity_sold = db.Column(db.Integer, nullable=False, default=0)  # Total quantity sold for this product
    last_sold_at = db.Column(db.DateTime, default=datetime.utcnow)  # Timestamp of the last sale

# Order model
class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(50), nullable=False, default="Pending")
    order_items = db.relationship('OrderItem', backref='order', lazy=True)

# OrderItem model
class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    phone_id = db.Column(db.Integer, db.ForeignKey('phone.id'), nullable=True)
    laptop_id = db.Column(db.Integer, db.ForeignKey('laptop.id'), nullable=True)
    audio_id = db.Column(db.Integer, db.ForeignKey('audio.id'), nullable=True)
    tablets_id = db.Column(db.Integer, db.ForeignKey('tablet.id'), nullable=True)
    quantity = db.Column(db.Integer, nullable=False, default=1)

# Review model
class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    phone_id = db.Column(db.Integer, db.ForeignKey('phone.id'), nullable=True)
    laptop_id = db.Column(db.Integer, db.ForeignKey('laptop.id'), nullable=True)
    audio_id = db.Column(db.Integer, db.ForeignKey('audio.id'), nullable=True)
    tablets_id = db.Column(db.Integer, db.ForeignKey('tablet.id'), nullable=True)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# WishList model
class WishList(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    phone_id = db.Column(db.Integer, db.ForeignKey('phone.id'), nullable=True)
    laptop_id = db.Column(db.Integer, db.ForeignKey('laptop.id'), nullable=True)
    audio_id = db.Column(db.Integer, db.ForeignKey('audio.id'), nullable=True)
    tablets_id = db.Column(db.Integer, db.ForeignKey('tablet.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Notification model
class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.String(255), nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# AuditLog model
class AuditLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('admin.id'), nullable=False)
    action = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


