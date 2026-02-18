"""
Product review model
"""

from datetime import datetime

from app.extensions import db


class Review(db.Model):
    """Product review and rating model"""

    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Review user_id={self.user_id} product_id={self.product_id} rating={self.rating}>"
