"""
Wishlist Routes Blueprint
Handles: viewing wishlist, adding/removing products
"""
import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import WishList, Product
from app.utils.response_formatter import format_response

logger = logging.getLogger(__name__)

# Create blueprint
wishlist_bp = Blueprint('wishlist', __name__)


# ============================================================================
# GET WISHLIST
# ============================================================================
@wishlist_bp.route('/', methods=['GET'])
@jwt_required()
def get_wishlist():
    """
    Get user's wishlist with full product details

    Requires: Valid JWT token

    Returns:
        200: Wishlist items with product details
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()

        # Get or create wishlist
        wishlist = WishList.query.filter_by(user_id=current_user_id).first()

        if not wishlist:
            # Create empty wishlist
            wishlist = WishList(user_id=current_user_id)
            db.session.add(wishlist)
            db.session.commit()
            return jsonify(format_response(True, {"wishlist": []}, "Wishlist is empty!")), 200

        # Build response with full product details
        wishlist_items = []
        for product in wishlist.products:
            item_data = {
                "id": product.id,
                "name": product.name,
                "image_url": product.image_urls[0] if product.image_urls else None,
                "price": float(product.price),
                "brand": product.brand.name if product.brand else "N/A",
                "category": product.category.name if product.category else "N/A"
            }
            wishlist_items.append(item_data)

        return jsonify(format_response(True, {"wishlist": wishlist_items}, "Wishlist fetched successfully")), 200

    except Exception as e:
        logger.error(f"Error fetching wishlist: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while fetching wishlist")), 500


# ============================================================================
# ADD TO WISHLIST
# ============================================================================
@wishlist_bp.route('/', methods=['POST'])
@jwt_required()
def add_to_wishlist():
    """
    Add product to wishlist

    Expected JSON:
    {
        "product_id": 123
    }

    Requires: Valid JWT token

    Returns:
        200: Product added to wishlist
        201: Product already in wishlist
        400: Invalid product ID
        404: Product not found
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        # Validate request
        if not data or 'product_id' not in data:
            return jsonify(format_response(False, None, "Product ID is required")), 400

        try:
            product_id = int(data['product_id'])
        except (TypeError, ValueError):
            return jsonify(format_response(False, None, "Invalid product ID format")), 400

        # Check if product exists
        product = db.session.get(Product, product_id)
        if not product:
            return jsonify(format_response(False, None, "Product not found")), 404

        # Get or create wishlist
        wishlist = WishList.query.filter_by(user_id=current_user_id).first()
        if not wishlist:
            wishlist = WishList(user_id=current_user_id)
            db.session.add(wishlist)
            db.session.flush()

        # Check if product already in wishlist
        if product in wishlist.products:
            return jsonify(format_response(True, None, "Product already in wishlist")), 201

        # Add product to wishlist
        wishlist.products.append(product)
        db.session.commit()

        logger.info(
            f"User {current_user_id} added product {product_id} to wishlist")
        return jsonify(format_response(True, None, "Product added to wishlist!")), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adding to wishlist: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while adding to wishlist")), 500


# ============================================================================
# REMOVE FROM WISHLIST
# ============================================================================
@wishlist_bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
def remove_from_wishlist(product_id):
    """
    Remove product from wishlist

    Args:
        product_id: ID of the product to remove

    Requires: Valid JWT token

    Returns:
        200: Product removed from wishlist
        404: Wishlist or product not found
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()

        # Get wishlist
        wishlist = WishList.query.filter_by(user_id=current_user_id).first()
        if not wishlist:
            return jsonify(format_response(False, None, "Wishlist not found")), 404

        # Get product
        product = db.session.get(Product, product_id)
        if not product:
            return jsonify(format_response(False, None, "Product not found")), 404

        # Check if product is in wishlist
        if product not in wishlist.products:
            return jsonify(format_response(False, None, "Product not found in wishlist")), 404

        # Remove product from wishlist
        wishlist.products.remove(product)
        db.session.commit()

        logger.info(
            f"User {current_user_id} removed product {product_id} from wishlist")
        return jsonify(format_response(True, None, "Product removed from wishlist!")), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error removing from wishlist: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while removing from wishlist")), 500
