"""
Cart Routes Blueprint
Handles: view cart, add to cart, update quantity, remove items, clear cart
"""
import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services import CartService
from app.utils.response_formatter import format_response

logger = logging.getLogger(__name__)

# Create blueprint
cart_bp = Blueprint('cart', __name__)


# ============================================================================
# GET CART
# ============================================================================
@cart_bp.route('/', methods=['GET'])
@jwt_required()
def get_cart():
    """
    Get current user's cart contents

    Requires: Valid JWT token

    Returns:
        200: Cart contents grouped by product
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()

        cart_contents = CartService.get_cart_contents(current_user_id)

        return jsonify(format_response(True, {"cart": cart_contents}, "Cart fetched successfully")), 200

    except Exception as e:
        logger.error(f"Error fetching cart: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while fetching cart")), 500


# ============================================================================
# ADD TO CART
# ============================================================================
@cart_bp.route('/', methods=['POST'])
@jwt_required()
def add_to_cart():
    """
    Add item to cart

    Requires: Valid JWT token

    Expected JSON:
    {
        "productId": 123,
        "quantity": 2,
        "selectedVariation": {  // optional
            "ram": "8GB",
            "storage": "256GB",
            "price": 50000
        }
    }

    Returns:
        201: Item added to cart
        400: Invalid request data
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        # Validate required fields
        if not data or 'productId' not in data or 'quantity' not in data:
            return jsonify(format_response(False, None, "productId and quantity are required")), 400

        try:
            product_id = int(data['productId'])
        except (ValueError, TypeError):
            return jsonify(format_response(False, None, "Invalid productId. Must be an integer")), 400

        if not isinstance(data['quantity'], int) or data['quantity'] <= 0:
            return jsonify(format_response(False, None, "Invalid quantity. Must be a positive integer")), 400

        # Handle variations if provided
        variation_name = None
        variation_price = None

        if data.get('selectedVariation'):
            variation = data['selectedVariation']

            if not isinstance(variation, dict):
                return jsonify(format_response(False, None, "Invalid selectedVariation. Must be an object")), 400

            if 'ram' not in variation or 'storage' not in variation or 'price' not in variation:
                return jsonify(format_response(False, None, "Variation must include ram, storage, and price")), 400

            variation_name = f"{variation['ram']} - {variation['storage']}"
            variation_price = variation['price']

            if not isinstance(variation_price, (int, float)) or variation_price <= 0:
                return jsonify(format_response(False, None, "Invalid variation price")), 400

        # Add to cart using service
        success, message = CartService.add_to_cart(
            current_user_id,
            product_id,
            data['quantity'],
            variation_name,
            variation_price
        )

        if not success:
            return jsonify(format_response(False, None, message)), 400

        logger.info(
            f"User {current_user_id} added product {product_id} to cart")
        return jsonify(format_response(True, None, message)), 201

    except Exception as e:
        logger.error(f"Error adding to cart: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while adding to cart")), 500


# ============================================================================
# UPDATE CART ITEM QUANTITY
# ============================================================================
@cart_bp.route('/', methods=['PUT'])
@jwt_required()
def update_cart_item():
    """
    Update quantity of cart item

    Requires: Valid JWT token

    Expected JSON:
    {
        "productId": 123,
        "quantity": 3,
        "selectedVariation": "8GB - 256GB"  // optional
    }

    Returns:
        200: Cart item updated
        400: Invalid request data
        404: Cart or item not found
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        # Validate required fields
        if not data or 'productId' not in data or 'quantity' not in data:
            return jsonify(format_response(False, None, "productId and quantity are required")), 400

        try:
            product_id = int(data['productId'])
        except (ValueError, TypeError):
            return jsonify(format_response(False, None, "Invalid productId. Must be an integer")), 400

        if not isinstance(data['quantity'], int) or data['quantity'] <= 0:
            return jsonify(format_response(False, None, "Invalid quantity. Must be a positive integer")), 400

        # Handle variation
        variation_name = data.get('selectedVariation')
        if variation_name and variation_name in ['null', None, '']:
            variation_name = None

        # Update cart item using service
        success, message = CartService.update_cart_item(
            current_user_id,
            product_id,
            data['quantity'],
            variation_name
        )

        if not success:
            status_code = 404 if "not found" in message.lower() else 400
            return jsonify(format_response(False, None, message)), status_code

        logger.info(f"User {current_user_id} updated cart item {product_id}")
        return jsonify(format_response(True, None, message)), 200

    except Exception as e:
        logger.error(f"Error updating cart: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while updating cart")), 500


# ============================================================================
# REMOVE FROM CART
# ============================================================================
@cart_bp.route('/', methods=['DELETE'])
@jwt_required()
def remove_from_cart():
    """
    Remove item from cart

    Requires: Valid JWT token

    Expected JSON:
    {
        "productId": 123,
        "selectedVariation": "8GB - 256GB"  // optional
    }

    Returns:
        200: Item removed
        400: Invalid request data
        404: Cart or item not found
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        # Validate required fields
        if not data or 'productId' not in data:
            return jsonify(format_response(False, None, "productId is required")), 400

        try:
            product_id = int(data['productId'])
        except (ValueError, TypeError):
            return jsonify(format_response(False, None, "Invalid productId. Must be an integer")), 400

        # Handle variation
        variation_name = data.get('selectedVariation')
        if variation_name and variation_name in ['null', None, '']:
            variation_name = None

        # Remove from cart using service
        success, message = CartService.remove_from_cart(
            current_user_id,
            product_id,
            variation_name
        )

        if not success:
            status_code = 404 if "not found" in message.lower() else 400
            return jsonify(format_response(False, None, message)), status_code

        logger.info(
            f"User {current_user_id} removed product {product_id} from cart")
        return jsonify(format_response(True, None, message)), 200

    except Exception as e:
        logger.error(f"Error removing from cart: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while removing from cart")), 500


# ============================================================================
# CLEAR CART
# ============================================================================
@cart_bp.route('/clear', methods=['DELETE'])
@jwt_required()
def clear_cart():
    """
    Clear entire cart

    Requires: Valid JWT token

    Returns:
        200: Cart cleared
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()

        success, message = CartService.clear_cart(current_user_id)

        if not success:
            return jsonify(format_response(False, None, message)), 500

        logger.info(f"User {current_user_id} cleared their cart")
        return jsonify(format_response(True, None, message)), 200

    except Exception as e:
        logger.error(f"Error clearing cart: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while clearing cart")), 500


# ============================================================================
# GET CART TOTAL
# ============================================================================
@cart_bp.route('/total', methods=['GET'])
@jwt_required()
def get_cart_total():
    """
    Get total value of cart

    Requires: Valid JWT token

    Returns:
        200: Cart total
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()

        total = CartService.get_cart_total(current_user_id)

        return jsonify(format_response(True, {
            "total": total,
            "currency": "KES"
        }, "Cart total calculated successfully")), 200

    except Exception as e:
        logger.error(f"Error calculating cart total: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while calculating total")), 500
