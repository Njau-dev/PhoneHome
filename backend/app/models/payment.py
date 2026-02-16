"""
Payment model for M-Pesa and COD transactions
"""
from datetime import datetime

from app.extensions import db


class Payment(db.Model):
    """Payment transaction model"""
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    order_reference = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(
        db.String(50), nullable=False)  # 'COD' or 'MPESA'
    status = db.Column(db.String(50), nullable=False, default='Pending')
    failure_reason = db.Column(db.Text, nullable=True)

    # M-Pesa specific fields
    transaction_id = db.Column(db.String(100), nullable=True)
    mpesa_receipt = db.Column(db.String(100), nullable=True)
    phone_number = db.Column(db.String(15), nullable=True)
    checkout_request_id = db.Column(db.String(100), nullable=True)
    merchant_request_id = db.Column(db.String(100), nullable=True)
    result_code = db.Column(db.String(10), nullable=True)
    result_desc = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Payment {self.order_reference} - {self.status}>'
