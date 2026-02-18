"""
Compare Routes Blueprint
Handles: product comparison list (max 3 items, auto-expires after 24hrs)
"""

import logging
from datetime import UTC, datetime, timedelta

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models import Compare, CompareItem, Product
from app.utils.response_formatter import format_response

logger = logging.getLogger(__name__)

# Create blueprint
compare_bp = Blueprint("compare", __name__)


# ============================================================================
# GET COMPARE LIST
# ============================================================================
@compare_bp.route("/", methods=["GET"])
@jwt_required()
def get_compare_list():
    """
    Get user's compare list

    Note: Items older than 24 hours are automatically deleted

    Requires: Valid JWT token

    Returns:
        200: List of product IDs in compare list
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()

        # Get or create compare list
        compare = Compare.query.filter_by(user_id=current_user_id).first()
        if not compare:
            return (
                jsonify(
                    format_response(
                        True,
                        {"message": "Compare list is empty", "product_ids": []},
                        "Compare list retrieved successfully",
                    )
                ),
                200,
            )

        # Delete items older than 24 hours
        twenty_four_hours_ago = datetime.now(UTC) - timedelta(hours=24)

        old_items = CompareItem.query.filter(
            CompareItem.compare_id == compare.id, CompareItem.created_at <= twenty_four_hours_ago
        ).all()

        for item in old_items:
            db.session.delete(item)

        if old_items:
            db.session.commit()
            logger.info(
                f"Deleted {len(old_items)} expired compare items for user {current_user_id}"
            )

        # Get remaining valid items
        compare_items = CompareItem.query.filter_by(compare_id=compare.id).all()

        # Return product IDs
        items = [{"id": item.product_id} for item in compare_items]

        return (
            jsonify(
                format_response(True, {"product_ids": items}, "Compare list retrieved successfully")
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Error fetching compare list: {str(e)}")
        return (
            jsonify(format_response(False, None, "An error occurred while fetching compare list")),
            500,
        )


# ============================================================================
# ADD TO COMPARE LIST
# ============================================================================
@compare_bp.route("/", methods=["POST"])
@jwt_required()
def add_to_compare():
    """
    Add product to compare list

    Expected JSON:
    {
        "product_id": 123
    }

    Note: Maximum 3 items allowed in compare list

    Requires: Valid JWT token

    Returns:
        201: Product added to compare list
        200: Product already in compare list
        400: Compare list full or invalid product ID
        404: Product not found
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        # Validate request
        if not data or "product_id" not in data:
            return jsonify(format_response(False, None, "Product ID is required")), 400

        try:
            product_id = int(data["product_id"])
        except (TypeError, ValueError):
            return jsonify(format_response(False, None, "Invalid product ID format")), 400

        # Check if product exists
        product = db.session.get(Product, product_id)
        if not product:
            return jsonify(format_response(False, None, "Product not found")), 404

        # Get or create compare list
        compare = Compare.query.filter_by(user_id=current_user_id).first()
        if not compare:
            compare = Compare(user_id=current_user_id)
            db.session.add(compare)
            db.session.flush()

        # Check if product already in compare list
        existing_item = CompareItem.query.filter_by(
            compare_id=compare.id, product_id=product_id
        ).first()

        if existing_item:
            return (
                jsonify(
                    format_response(
                        True,
                        {"message": "Product already in compare list"},
                        "Product already in compare list",
                    )
                ),
                200,
            )

        # Check if compare list has reached limit (3 items)
        current_items_count = CompareItem.query.filter_by(compare_id=compare.id).count()
        if current_items_count >= 3:
            return jsonify(format_response(False, None, "Compare list is full (max 3 items)")), 400

        # Add new item to compare list
        compare_item = CompareItem(compare_id=compare.id, product_id=product_id)

        db.session.add(compare_item)
        db.session.commit()

        logger.info(f"User {current_user_id} added product {product_id} to compare list")
        return (
            jsonify(
                format_response(
                    True,
                    {"message": "Product added to compare list"},
                    "Product added to compare list",
                )
            ),
            201,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error adding to compare list: {str(e)}")
        return (
            jsonify(format_response(False, None, "An error occurred while adding to compare list")),
            500,
        )


# ============================================================================
# REMOVE FROM COMPARE LIST
# ============================================================================
@compare_bp.route("/<int:product_id>", methods=["DELETE"])
@jwt_required()
def remove_from_compare(product_id):
    """
    Remove product from compare list

    Args:
        product_id: ID of the product to remove

    Requires: Valid JWT token

    Returns:
        200: Product removed from compare list
        404: Compare list or product not found
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()

        # Get compare list
        compare = Compare.query.filter_by(user_id=current_user_id).first()
        if not compare:
            return jsonify(format_response(False, None, "Compare list not found")), 404

        # Find and delete the compare item
        compare_item = CompareItem.query.filter_by(
            compare_id=compare.id, product_id=product_id
        ).first()

        if not compare_item:
            return jsonify(format_response(False, None, "Product not found in compare list")), 404

        db.session.delete(compare_item)
        db.session.commit()

        logger.info(f"User {current_user_id} removed product {product_id} from compare list")
        return (
            jsonify(
                format_response(
                    True,
                    {"message": "Product removed from compare list"},
                    "Product removed from compare list",
                )
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error removing from compare list: {str(e)}")
        return (
            jsonify(
                format_response(False, None, "An error occurred while removing from compare list")
            ),
            500,
        )


# ============================================================================
# CLEAR COMPARE LIST
# ============================================================================
@compare_bp.route("/clear", methods=["DELETE"])
@jwt_required()
def clear_compare():
    """
    Clear entire compare list

    Requires: Valid JWT token

    Returns:
        200: Compare list cleared
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()

        # Get compare list
        compare = Compare.query.filter_by(user_id=current_user_id).first()
        if not compare:
            return (
                jsonify(
                    format_response(
                        True, {"message": "Compare list already empty"}, "Compare list cleared"
                    )
                ),
                200,
            )

        # Delete all items
        CompareItem.query.filter_by(compare_id=compare.id).delete()

        # Delete compare list
        db.session.delete(compare)
        db.session.commit()

        logger.info(f"User {current_user_id} cleared their compare list")
        return (
            jsonify(
                format_response(True, {"message": "Compare list cleared"}, "Compare list cleared")
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error clearing compare list: {str(e)}")
        return (
            jsonify(format_response(False, None, "An error occurred while clearing compare list")),
            500,
        )
