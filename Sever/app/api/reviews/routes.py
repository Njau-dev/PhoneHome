"""
Reviews Routes Blueprint
Handles: product reviews and ratings
"""
import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import Review, Product
from app.services.notification_service import create_notification

logger = logging.getLogger(__name__)

# Create blueprint
reviews_bp = Blueprint('reviews', __name__)


# ============================================================================
# GET PRODUCT REVIEWS
# ============================================================================
@reviews_bp.route('/product/<int:product_id>', methods=['GET'])
def get_product_reviews(product_id):
    """
    Get all reviews for a product

    Args:
        product_id: ID of the product

    Returns:
        200: List of reviews
        404: Product not found
        500: Server error
    """
    try:
        # Check if product exists
        product = Product.query.get(product_id)
        if not product:
            return jsonify({"error": "Product not found"}), 404

        # Get reviews
        reviews = Review.query.filter_by(product_id=product_id).order_by(
            Review.created_at.desc()
        ).all()

        if not reviews:
            return jsonify({"message": "No reviews found for this product", "reviews": []}), 200

        # Serialize reviews
        review_list = []
        for review in reviews:
            review_list.append({
                "id": review.id,
                "user": review.user.username if review.user else "Anonymous",
                "rating": review.rating,
                "comment": review.comment,
                "timestamp": review.created_at.isoformat()
            })

        return jsonify({"reviews": review_list}), 200

    except Exception as e:
        logger.error(f"Error fetching reviews: {str(e)}")
        return jsonify({"error": "An error occurred while fetching reviews"}), 500


# ============================================================================
# ADD REVIEW
# ============================================================================
@reviews_bp.route('/product/<int:product_id>', methods=['POST'])
@jwt_required()
def add_review(product_id):
    """
    Add a review for a product

    Args:
        product_id: ID of the product

    Expected JSON:
    {
        "rating": 5,
        "comment": "Great product!"
    }

    Requires: Valid JWT token

    Returns:
        201: Review added successfully
        400: Invalid data or user already reviewed
        404: Product not found
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        # Validate product exists
        product = Product.query.get(product_id)
        if not product:
            return jsonify({"error": "Product not found"}), 404

        # Validate required fields
        if not data or 'rating' not in data:
            return jsonify({"error": "Rating is required"}), 400

        rating = data.get('rating')
        comment = data.get('comment', '')

        # Validate rating
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({"error": "Rating must be between 1 and 5"}), 400

        # Check if user already reviewed this product
        existing_review = Review.query.filter_by(
            user_id=current_user_id,
            product_id=product_id
        ).first()

        if existing_review:
            return jsonify({"error": "You have already reviewed this product"}), 400

        # Create review
        new_review = Review(
            user_id=current_user_id,
            product_id=product_id,
            rating=rating,
            comment=comment
        )

        db.session.add(new_review)
        db.session.commit()

        # Create notification
        create_notification(
            current_user_id,
            f"Thank you for reviewing {product.name}! Your feedback helps other customers."
        )

        logger.info(f"User {current_user_id} reviewed product {product_id}")

        return jsonify({"message": "Review added successfully!"}), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adding review: {str(e)}")
        return jsonify({"error": "An error occurred while adding the review"}), 500


# ============================================================================
# UPDATE REVIEW
# ============================================================================
@reviews_bp.route('/<int:review_id>', methods=['PUT'])
@jwt_required()
def update_review(review_id):
    """
    Update user's own review

    Args:
        review_id: ID of the review

    Expected JSON:
    {
        "rating": 4,
        "comment": "Updated comment"
    }

    Requires: Valid JWT token

    Returns:
        200: Review updated successfully
        400: Invalid data
        403: Unauthorized (not review owner)
        404: Review not found
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()

        # Find review
        review = Review.query.get(review_id)
        if not review:
            return jsonify({"error": "Review not found"}), 404

        # Verify ownership
        if str(review.user_id) != current_user_id:
            return jsonify({"error": "You can only update your own reviews"}), 403

        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400

        # Update rating if provided
        if 'rating' in data:
            rating = data['rating']
            if not isinstance(rating, int) or rating < 1 or rating > 5:
                return jsonify({"error": "Rating must be between 1 and 5"}), 400
            review.rating = rating

        # Update comment if provided
        if 'comment' in data:
            review.comment = data['comment']

        db.session.commit()

        logger.info(f"User {current_user_id} updated review {review_id}")

        return jsonify({"message": "Review updated successfully!"}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating review: {str(e)}")
        return jsonify({"error": "An error occurred while updating the review"}), 500


# ============================================================================
# DELETE REVIEW
# ============================================================================
@reviews_bp.route('/<int:review_id>', methods=['DELETE'])
@jwt_required()
def delete_review(review_id):
    """
    Delete user's own review

    Args:
        review_id: ID of the review

    Requires: Valid JWT token

    Returns:
        200: Review deleted successfully
        403: Unauthorized (not review owner)
        404: Review not found
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()

        # Find review
        review = Review.query.get(review_id)
        if not review:
            return jsonify({"error": "Review not found"}), 404

        # Verify ownership
        if str(review.user_id) != current_user_id:
            return jsonify({"error": "You can only delete your own reviews"}), 403

        db.session.delete(review)
        db.session.commit()

        logger.info(f"User {current_user_id} deleted review {review_id}")

        return jsonify({"message": "Review deleted!"}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting review: {str(e)}")
        return jsonify({"error": "An error occurred while deleting the review"}), 500


# ============================================================================
# GET USER'S REVIEWS
# ============================================================================
@reviews_bp.route('/my-reviews', methods=['GET'])
@jwt_required()
def get_my_reviews():
    """
    Get all reviews by current user

    Requires: Valid JWT token

    Returns:
        200: List of user's reviews
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()

        reviews = Review.query.filter_by(user_id=current_user_id).order_by(
            Review.created_at.desc()
        ).all()

        review_list = []
        for review in reviews:
            product = Product.query.get(review.product_id)
            review_list.append({
                "id": review.id,
                "product_id": review.product_id,
                "product_name": product.name if product else "Unknown",
                "product_image": product.image_urls[0] if product and product.image_urls else None,
                "rating": review.rating,
                "comment": review.comment,
                "timestamp": review.created_at.isoformat()
            })

        return jsonify({"reviews": review_list}), 200

    except Exception as e:
        logger.error(f"Error fetching user reviews: {str(e)}")
        return jsonify({"error": "An error occurred while fetching your reviews"}), 500
