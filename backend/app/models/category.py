"""
Category and Brand models with many-to-many relationship
"""
from app.extensions import db

# Association table for Brand and Category many-to-many relationship
brand_categories = db.Table('brand_categories',
                            db.Column('brand_id', db.Integer, db.ForeignKey(
                                'brands.id'), primary_key=True),
                            db.Column('category_id', db.Integer, db.ForeignKey(
                                'categories.id'), primary_key=True)
                            )


class Category(db.Model):
    """Product category model (Phone, Laptop, Tablet, Audio)"""
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False, index=True)

    # Relationships
    products = db.relationship(
        'Product', backref='category', lazy=True, cascade="all, delete-orphan")
    brands = db.relationship(
        'Brand', secondary=brand_categories, back_populates='categories', lazy='dynamic')

    def __repr__(self):
        return f'<Category {self.name}>'


class Brand(db.Model):
    """Product brand model (Samsung, Apple, etc.)"""
    __tablename__ = 'brands'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False, index=True)

    # Relationships
    products = db.relationship(
        'Product', backref='brand', lazy=True, cascade="all, delete-orphan")
    categories = db.relationship(
        'Category', secondary=brand_categories, back_populates='brands', lazy='dynamic')

    def __repr__(self):
        return f'<Brand {self.name}>'
