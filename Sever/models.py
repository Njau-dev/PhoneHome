from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

# User model
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone_number = db.Column(db.String(15), nullable=False)
    address = db.Column(db.String(255), nullable=True)
    password_hash = db.Column(db.String(450), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    orders = db.relationship('Order', backref='user', lazy=True, cascade="all, delete-orphan")
    cart = db.relationship('Cart', uselist=False, backref='user', lazy=True)
    role = db.Column(db.String(50), default='user')
    reviews = db.relationship('Review', backref='user', lazy=True, cascade="all, delete-orphan")
    wishlist_items = db.relationship('WishList', backref='user', lazy=True, cascade="all, delete-orphan")
    notifications = db.relationship('Notification', backref='user', lazy=True, cascade="all, delete-orphan")
    addresses = db.relationship('Address', backref='user', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


# Admin model
class Admin(db.Model):
    __tablename__ = 'admins'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(450), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    audit_logs = db.relationship('AuditLog', backref='admin', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


# Category model
class Category(db.Model):
    __tablename__ = 'categories'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False, index=True)
    products = db.relationship('Product', backref='category', lazy=True, cascade="all, delete-orphan")


# Brand model
class Brand(db.Model):
    __tablename__ = 'brands'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False, index=True)
    products = db.relationship('Product', backref='brand', lazy=True, cascade="all, delete-orphan")


# Product base model
class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, index=True)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=False)
    image_urls = db.Column(db.JSON, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    brand_id = db.Column(db.Integer, db.ForeignKey('brands.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    type = db.Column(db.String(50), nullable=False)  # Used for product type (polymorphic identity)
    __mapper_args__ = {'polymorphic_on': type}

# Variations model for RAM and storage
class ProductVariation(db.Model):
    __tablename__ = 'product_variations'
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    ram = db.Column(db.String(50), nullable=False)
    storage = db.Column(db.String(50), nullable=False)
    price = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship back to the product
    product = db.relationship('Product', backref=db.backref('variations', lazy=True))

# Phone model inheriting from Product
class Phone(Product):
    __tablename__ = 'phones'
    id = db.Column(db.Integer, db.ForeignKey('products.id'), primary_key=True)
    ram = db.Column(db.String(20), nullable=False)
    storage = db.Column(db.String(20), nullable=False)
    battery = db.Column(db.String(50), nullable=False)
    main_camera = db.Column(db.String(100), nullable=False)
    front_camera = db.Column(db.String(100), nullable=False)
    display = db.Column(db.String(100), nullable=False)
    processor = db.Column(db.String(100), nullable=False)
    connectivity = db.Column(db.String(100), nullable=False)
    colors = db.Column(db.String(100), nullable=False)
    os = db.Column(db.String(50), nullable=False)
    __mapper_args__ = {'polymorphic_identity': 'phone'}


# Laptop model inheriting from Product
class Laptop(Product):
    __tablename__ = 'laptops'
    id = db.Column(db.Integer, db.ForeignKey('products.id'), primary_key=True)
    ram = db.Column(db.String(20), nullable=False)
    storage = db.Column(db.String(20), nullable=False)
    battery = db.Column(db.String(50), nullable=False)
    display = db.Column(db.String(100), nullable=False)
    processor = db.Column(db.String(100), nullable=False)
    os = db.Column(db.String(50), nullable=False)
    __mapper_args__ = {'polymorphic_identity': 'laptop'}


# Tablet model inheriting from Product
class Tablet(Product):
    __tablename__ = 'tablets'
    id = db.Column(db.Integer, db.ForeignKey('products.id'), primary_key=True)
    ram = db.Column(db.String(50), nullable=False)
    storage = db.Column(db.String(50), nullable=False)
    battery = db.Column(db.String(100), nullable=False)
    display = db.Column(db.String(100), nullable=False)
    processor = db.Column(db.String(100), nullable=False)
    main_camera = db.Column(db.String(100), nullable=False)
    front_camera = db.Column(db.String(100), nullable=False)
    connectivity = db.Column(db.String(100), nullable=False)
    colors = db.Column(db.String(100), nullable=False)
    os = db.Column(db.String(100), nullable=False)
    __mapper_args__ = {'polymorphic_identity': 'tablet'}


# Audio model inheriting from Product
class Audio(Product):
    __tablename__ = 'audio'
    id = db.Column(db.Integer, db.ForeignKey('products.id'), primary_key=True)
    battery = db.Column(db.String(50), nullable=False)
    __mapper_args__ = {'polymorphic_identity': 'audio'}

# Cart model
class Cart(db.Model):
    __tablename__ = 'carts'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    items = db.relationship('CartItem', backref='cart', lazy=True, cascade="all, delete-orphan")


# CartItem model (supports polymorphic products)
class CartItem(db.Model):
    __tablename__ = 'cart_items'
    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.Integer, db.ForeignKey('carts.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)


# Order model
class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(50), nullable=False, default="Pending")
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    order_items = db.relationship('OrderItem', backref='order', lazy=True, cascade="all, delete-orphan")


# OrderItem model (supports polymorphic products)
class OrderItem(db.Model):
    __tablename__ = 'order_items'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)


# Payment model
class Payment(db.Model):
    __tablename__ = 'payments'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), nullable=False)  # e.g., 'Completed', 'Pending'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# Shipment model
class Shipment(db.Model):
    __tablename__ = 'shipments'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    tracking_number = db.Column(db.String(100), unique=True, nullable=False)
    carrier = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(50), nullable=False)  # e.g., 'Shipped', 'In Transit', 'Delivered'
    estimated_delivery = db.Column(db.DateTime, nullable=False)


# WishList model
class WishList(db.Model):
    __tablename__ = 'wishlists'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# Review model
class Review(db.Model):
    __tablename__ = 'reviews'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# Address model
class Address(db.Model):
    __tablename__ = 'addresses'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    address_line1 = db.Column(db.String(255), nullable=False)
    address_line2 = db.Column(db.String(255), nullable=True)
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    postal_code = db.Column(db.String(20), nullable=False)
    country = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# Notification model
class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.String(255), nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# AuditLog model
class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('admins.id'), nullable=False)
    action = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)



