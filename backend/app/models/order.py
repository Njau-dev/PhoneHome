"""
Order and Address models
"""

from datetime import datetime

from app.extensions import db


class Order(db.Model):
    """Customer order model"""

    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    order_reference = db.Column(db.String(50), unique=True, nullable=True)
    address_id = db.Column(db.Integer, db.ForeignKey("addresses.id"), nullable=True)
    payment_id = db.Column(db.Integer, db.ForeignKey("payments.id"), nullable=True)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), nullable=False, default="Order Placed")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    order_items = db.relationship(
        "OrderItem", backref="order", lazy=True, cascade="all, delete-orphan"
    )
    address = db.relationship("Address", backref="orders")
    payment = db.relationship("Payment", backref="order", uselist=False)

    @staticmethod
    def generate_order_reference():
        """Generate unique order reference like PHK-001, PHK-002, etc."""
        last_order = Order.query.order_by(Order.id.desc()).first()
        if last_order:
            last_number = int(last_order.order_reference.split("-")[1])
            new_number = str(last_number + 1).zfill(3)
        else:
            new_number = "001"
        return f"PHK-{new_number}"

    def __repr__(self):
        return f"<Order {self.order_reference}>"


class OrderItem(db.Model):
    """Individual items in an order"""

    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    variation_name = db.Column(db.String(255), nullable=True)
    variation_price = db.Column(db.Integer, nullable=True)

    # Relationships
    product = db.relationship("Product", backref="order_items", lazy=True)

    def __repr__(self):
        return f"<OrderItem order_id={self.order_id} product_id={self.product_id}>"


class Address(db.Model):
    """Shipping/billing address model"""

    __tablename__ = "addresses"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    street = db.Column(db.String(255), nullable=False)
    additional_info = db.Column(db.Text, nullable=True)
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Address {self.first_name} {self.last_name}, {self.city}>"
