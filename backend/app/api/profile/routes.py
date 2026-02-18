"""
Profile Routes Blueprint
Handles: user profile, stats, recent orders, wishlist
"""

import logging

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import func

from app.extensions import db
from app.models import Order, Payment, Review, User, WishList
from app.services import OrderService
from app.utils.response_formatter import format_response

logger = logging.getLogger(__name__)

# Create blueprint
profile_bp = Blueprint("profile", __name__)


# ============================================================================
# GET USER PROFILE
# ============================================================================
@profile_bp.route("/", methods=["GET"])
@jwt_required()
def get_profile():
    """
    Get current user's profile information

    Requires: Valid JWT token

    Returns:
        200: User profile data
        404: User not found
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, current_user_id)

        if not user:
            return jsonify(format_response(False, None, "User not found")), 404

        user_data = {
            "username": user.username,
            "email": user.email,
            "phone_number": user.phone_number,
            "address": user.address,
            "created_at": user.created_at.isoformat(),
        }

        return (
            jsonify(format_response(True, {"profile": user_data}, "Profile fetched successfully")),
            200,
        )

    except Exception as e:
        logger.error(f"Error fetching profile: {str(e)}")
        return (
            jsonify(format_response(False, None, "An error occurred while fetching profile")),
            500,
        )


# ============================================================================
# UPDATE USER PROFILE
# ============================================================================
@profile_bp.route("/", methods=["PUT"])
@jwt_required()
def update_profile():
    """
    Update current user's profile

    Expected JSON (all fields optional):
    {
        "username": "newusername",
        "email": "newemail@example.com",
        "phone_number": "0712345678",
        "address": "New address"
    }

    Requires: Valid JWT token

    Returns:
        200: Profile updated successfully
        404: User not found
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, current_user_id)

        if not user:
            return jsonify(format_response(False, None, "User not found")), 404

        data = request.get_json()

        user.username = data.get("username", user.username)
        user.email = data.get("email", user.email)
        user.phone_number = data.get("phone_number", user.phone_number)
        user.address = data.get("address", user.address)

        db.session.commit()

        return jsonify(format_response(True, None, "Profile updated successfully")), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating profile: {str(e)}")
        return (
            jsonify(format_response(False, None, "An error occurred while updating profile")),
            500,
        )


# ============================================================================
# GET PROFILE STATS
# ============================================================================
@profile_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_profile_stats():
    """
    Get user statistics for dashboard

    Returns:
    - order_count: Total number of orders
    - total_payment: Total amount paid (successful payments only)
    - wishlist_count: Number of items in wishlist
    - review_count: Number of reviews written

    Requires: Valid JWT token

    Returns:
        200: User statistics
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()

        # 1. Get order count
        order_count = Order.query.filter_by(user_id=current_user_id).count()

        # 2. Get total payment amount
        total_payment = (
            db.session.query(func.coalesce(func.sum(Order.total_amount), 0))
            .join(Payment)
            .filter(Order.user_id == current_user_id, Payment.status == "successful")
            .scalar()
            or 0
        )

        # 3. Get wishlist count
        wishlist = WishList.query.filter_by(user_id=current_user_id).first()
        wishlist_count = len(wishlist.products) if wishlist else 0

        # 4. Get review count
        review_count = Review.query.filter_by(user_id=current_user_id).count()

        stats = {
            "order_count": order_count,
            "total_payment": round(float(total_payment), 2),
            "wishlist_count": wishlist_count,
            "review_count": review_count,
        }

        return (
            jsonify(format_response(True, {"stats": stats}, "Profile stats fetched successfully")),
            200,
        )

    except Exception as e:
        logger.error(f"Error fetching profile stats: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while fetching stats")), 500


# ============================================================================
# GET PROFILE ORDERS
# ============================================================================


@profile_bp.route("/orders", methods=["GET"])
@jwt_required()
def get_profile_orders():
    """
    Get user's recent orders (last 5)

    Requires: Valid JWT token

    Returns:
        200: List of recent orders
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()

        orders = OrderService.get_user_orders(current_user_id)

        recent_orders = orders[:5]

        return (
            jsonify(
                format_response(
                    True, {"orders": recent_orders}, "Profile orders fetched successfully"
                )
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Error fetching profile orders: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while fetching orders")), 500


# ============================================================================
# GET PROFILE WISHLIST
# ============================================================================


@profile_bp.route("/wishlist", methods=["GET"])
@jwt_required()
def get_profile_wishlist():
    """
    Get user's wishlist items

    Requires: Valid JWT token

    Returns:
        200: List of wishlist items
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()

        wishlist = WishList.query.filter_by(user_id=current_user_id).first()

        if not wishlist:
            return jsonify(format_response(True, {"wishlist": []}, "Wishlist is empty!")), 200

        wishlist_items = []

        for product in wishlist.products:
            item_data = {
                "id": product.id,
                "product_name": product.name,
                "brand": product.brand.name if product.brand else "N/A",
                "image_url": product.image_urls[0] if product.image_urls else None,
                "price": float(product.price),
            }
            wishlist_items.append(item_data)

        return (
            jsonify(
                format_response(
                    True, {"wishlist": wishlist_items}, "Profile wishlist fetched successfully"
                )
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Error fetching profile wishlist: {str(e)}")
        return (
            jsonify(format_response(False, None, "An error occurred while fetching wishlist")),
            500,
        )
