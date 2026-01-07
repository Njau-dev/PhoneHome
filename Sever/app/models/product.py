"""
Product models: Base Product class and specific product types
Uses SQLAlchemy's Single Table Inheritance
"""
from datetime import datetime
from app.extensions import db


class Product(db.Model):
    """Base product model - parent class for all product types"""
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, index=True)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=False)
    image_urls = db.Column(db.JSON, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey(
        'categories.id'), nullable=False)
    brand_id = db.Column(db.Integer, db.ForeignKey(
        'brands.id'), nullable=False)
    hasVariation = db.Column(db.Boolean, default=False)
    isBestSeller = db.Column(db.Boolean, default=False)
    type = db.Column(db.String(50), nullable=False)  # Discriminator column
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    variations = db.relationship(
        'ProductVariation',
        lazy=True,
        cascade='all, delete-orphan',
        back_populates='product',
        overlaps="product"
    )

    # Polymorphic configuration
    __mapper_args__ = {
        'polymorphic_on': type,
        'polymorphic_identity': 'product'
    }

    def __repr__(self):
        return f'<Product {self.name}>'


class ProductVariation(db.Model):
    """Product variations for RAM/Storage combinations"""
    __tablename__ = 'product_variations'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey(
        'products.id'), nullable=False)
    ram = db.Column(db.String(50), nullable=False)
    storage = db.Column(db.String(50), nullable=False)
    price = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship back to product
    product = db.relationship(
        'Product', back_populates='variations', overlaps="variations")

    def __repr__(self):
        return f'<ProductVariation {self.ram}/{self.storage}>'


class Phone(Product):
    """Phone product model"""
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

    __mapper_args__ = {
        'polymorphic_identity': 'phone'
    }

    def __repr__(self):
        return f'<Phone {self.name}>'


class Laptop(Product):
    """Laptop product model"""
    __tablename__ = 'laptops'

    id = db.Column(db.Integer, db.ForeignKey('products.id'), primary_key=True)
    ram = db.Column(db.String(20), nullable=False)
    storage = db.Column(db.String(20), nullable=False)
    battery = db.Column(db.String(50), nullable=False)
    display = db.Column(db.String(100), nullable=False)
    processor = db.Column(db.String(100), nullable=False)
    os = db.Column(db.String(50), nullable=False)

    __mapper_args__ = {
        'polymorphic_identity': 'laptop'
    }

    def __repr__(self):
        return f'<Laptop {self.name}>'


class Tablet(Product):
    """Tablet product model"""
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

    __mapper_args__ = {
        'polymorphic_identity': 'tablet'
    }

    def __repr__(self):
        return f'<Tablet {self.name}>'


class Audio(Product):
    """Audio product model (headphones, speakers, etc.)"""
    __tablename__ = 'audio'

    id = db.Column(db.Integer, db.ForeignKey('products.id'), primary_key=True)
    battery = db.Column(db.String(50), nullable=False)

    __mapper_args__ = {
        'polymorphic_identity': 'audio'
    }

    def __repr__(self):
        return f'<Audio {self.name}>'
