"""
Brands Routes Blueprint
Handles: brands CRUD operations
"""
import logging

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from app.extensions import db
from app.models import Brand, Product
from app.utils.decorators import admin_required
from app.utils.response_formatter import format_response

logger = logging.getLogger(__name__)

# Create blueprint
brands_bp = Blueprint('brands', __name__)

# ============================================================================
# GET ALL BRANDS
# ============================================================================


@brands_bp.route('/', methods=['GET'])
def get_all_brands():
    """
    Get all brands with their product count.

    Returns:
        200: List of brands  [ { id, name, product_count } ]
        500: Server error
    """
    try:
        # One query: left-join Product on product.brand == brand.id,
        # group by brand, count products per brand.
        rows = (
            db.session.query(
                Brand.id,
                Brand.name,
                func.count(Product.id).label('product_count')
            )
            .outerjoin(Product, Product.brand_id == Brand.id)
            .group_by(Brand.id, Brand.name)
            .order_by(Brand.name)
            .all()
        )

        brand_data = [
            {
                "id":            row.id,
                "name":          row.name,
                "product_count": row.product_count,
            }
            for row in rows
        ]

        return jsonify(
            format_response(True, {"brands": brand_data},
                            "Brands fetched successfully")
        ), 200

    except Exception as e:
        logger.error(f"Error fetching brands: {e}")
        return jsonify(
            format_response(
                False, None, "An error occurred while fetching brands")
        ), 500


# ============================================================================
# GET BRAND BY ID
# ============================================================================
@brands_bp.route('/<int:brand_id>', methods=['GET'])
def get_brand_by_id(brand_id):
    """
    Get a brand by ID

    Args:
        brand_id: ID of the brand

    Returns:
        200: Brand data
        404: Brand not found
        500: Server error
    """
    try:
        brand = db.session.get(Brand, brand_id)
        if not brand:
            return jsonify(format_response(False, None, "Brand not found")), 404

        brand_data = {
            "id": brand.id,
            "name": brand.name
        }

        return jsonify(format_response(True, {"brand": brand_data}, "Brand fetched successfully")), 200

    except Exception as e:
        logger.error(f"Error fetching brand by ID: {e}")
        return jsonify(format_response(False, None, "An error occurred while fetching the brand")), 500


# ============================================================================
# CREATE NEW BRAND
# ============================================================================
@brands_bp.route('/', methods=['POST'])
@jwt_required()
@admin_required
def create_brand():
    """
    Create a new brand

    Requires: Valid JWT token with admin privileges

    Returns:
        201: Created brand data
        400: Bad request
        500: Server error
    """
    try:
        data = request.get_json()
        brand_name = data.get('name')

        if not brand_name:
            return jsonify(format_response(False, None, "Brand name is required")), 400

        # Check if brand already exists
        existing_brand = Brand.query.filter_by(name=brand_name).first()
        if existing_brand:
            return jsonify(format_response(False, None, "Brand already exists")), 400

        new_brand = Brand(name=brand_name)
        db.session.add(new_brand)
        db.session.commit()

        brand_data = {
            "id": new_brand.id,
            "name": new_brand.name
        }

        return jsonify(format_response(True, {"brand": brand_data}, "Brand created successfully")), 201

    except Exception as e:
        logger.error(f"Error creating brand: {e}")
        return jsonify(format_response(False, None, "An error occurred while creating the brand")), 500


# ===========================================================================
# UPDATE BRAND BY ID
# ============================================================================
@brands_bp.route('/<int:brand_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_brand(brand_id):
    """
    Update a brand by ID

    Requires: Valid JWT token with admin privileges

    Args:
        brand_id: ID of the brand to update

    Returns:
        200: Updated brand data
        400: Bad request
        404: Brand not found
        500: Server error
    """
    try:
        brand = db.session.get(Brand, brand_id)
        if not brand:
            return jsonify(format_response(False, None, "Brand not found")), 404

        data = request.get_json()
        brand.name = data.get('name')

        db.session.commit()

        brand_data = {
            "id": brand.id,
            "name": brand.name
        }

        return jsonify(format_response(True, {"brand": brand_data}, "Brand updated successfully")), 200

    except Exception as e:
        logger.error(f"Error updating brand: {e}")
        return jsonify(format_response(False, None, "An error occurred while updating the brand")), 500


# ============================================================================
# DELETE BRAND BY ID
# ============================================================================
@brands_bp.route('/<int:brand_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_brand(brand_id):
    """
    Delete a brand by ID

    Requires: Valid JWT token with admin privileges

    Args:
        brand_id: ID of the brand to delete

    Returns:
        200: Success message
        404: Brand not found
        500: Server error
    """
    try:
        brand = db.session.get(Brand, brand_id)
        if not brand:
            return jsonify(format_response(False, None, "Brand not found")), 404

        db.session.delete(brand)
        db.session.commit()

        return jsonify(format_response(True, None, "Brand deleted successfully")), 200

    except Exception as e:
        logger.error(f"Error deleting brand: {e}")
        return jsonify(format_response(False, None, "An error occurred while deleting the brand")), 500
