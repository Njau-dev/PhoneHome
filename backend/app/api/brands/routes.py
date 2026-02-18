"""
Brands Routes Blueprint
Handles: brands CRUD operations
"""

import logging

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy import func

from app.extensions import db
from app.models import Brand, Category, Product, brand_categories
from app.utils.decorators import admin_required
from app.utils.response_formatter import format_response

logger = logging.getLogger(__name__)

# Create blueprint
brands_bp = Blueprint("brands", __name__)

# ============================================================================
# GET ALL BRANDS
# ============================================================================


@brands_bp.route("/", methods=["GET"])
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
            db.session.query(Brand.id, Brand.name, func.count(Product.id).label("product_count"))
            .outerjoin(Product, Product.brand_id == Brand.id)
            .group_by(Brand.id, Brand.name)
            .order_by(Brand.name)
            .all()
        )

        brand_data = [
            {
                "id": row.id,
                "name": row.name,
                "product_count": row.product_count,
            }
            for row in rows
        ]

        return (
            jsonify(format_response(True, {"brands": brand_data}, "Brands fetched successfully")),
            200,
        )

    except Exception as e:
        logger.error(f"Error fetching brands: {e}")
        return jsonify(format_response(False, None, "An error occurred while fetching brands")), 500


# ============================================================================
# GET BRAND ALONG WITH THE CATEGORIES
# ============================================================================


@brands_bp.route("/all", methods=["GET"])
def get_all_brands_with_categories():
    """
    Get all brands with all their categories.

    Returns:
        200: List of brands [ { id, name, categories: [ { id, name } ] } ]
        500: Server error
    """
    try:
        brand_rows = (
            db.session.query(Brand.id.label("brand_id"), Brand.name.label("brand_name"))
            .order_by(Brand.name)
            .all()
        )

        brands_map = {
            row.brand_id: {"id": row.brand_id, "name": row.brand_name, "categories": []}
            for row in brand_rows
        }

        seen_pairs = set()

        relation_rows = (
            db.session.query(
                brand_categories.c.brand_id.label("brand_id"),
                Category.id.label("category_id"),
                Category.name.label("category_name"),
            )
            .join(Category, Category.id == brand_categories.c.category_id)
            .order_by(brand_categories.c.brand_id, Category.name)
            .all()
        )

        for row in relation_rows:
            pair = (row.brand_id, row.category_id)
            if pair in seen_pairs or row.brand_id not in brands_map:
                continue
            seen_pairs.add(pair)
            brands_map[row.brand_id]["categories"].append(
                {"id": row.category_id, "name": row.category_name}
            )

        # Fallback for existing data where brand_categories has not been populated yet:
        # derive brand-category pairs from products.
        product_rows = (
            db.session.query(
                Product.brand_id.label("brand_id"),
                Category.id.label("category_id"),
                Category.name.label("category_name"),
            )
            .join(Category, Category.id == Product.category_id)
            .distinct()
            .order_by(Product.brand_id, Category.name)
            .all()
        )

        for row in product_rows:
            pair = (row.brand_id, row.category_id)
            if pair in seen_pairs or row.brand_id not in brands_map:
                continue
            seen_pairs.add(pair)
            brands_map[row.brand_id]["categories"].append(
                {"id": row.category_id, "name": row.category_name}
            )

        return (
            jsonify(
                format_response(
                    True,
                    {"brands": list(brands_map.values())},
                    "Brands with categories fetched successfully",
                )
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Error fetching brands with categories: {e}")
        return jsonify(format_response(False, None, "An error occurred while fetching brands")), 500


# ============================================================================
# GET BRAND BY ID
# ============================================================================
@brands_bp.route("/<int:brand_id>", methods=["GET"])
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

        brand_data = {"id": brand.id, "name": brand.name}

        return (
            jsonify(format_response(True, {"brand": brand_data}, "Brand fetched successfully")),
            200,
        )

    except Exception as e:
        logger.error(f"Error fetching brand by ID: {e}")
        return (
            jsonify(format_response(False, None, "An error occurred while fetching the brand")),
            500,
        )


# ============================================================================
# CREATE NEW BRAND
# ============================================================================
@brands_bp.route("/", methods=["POST"])
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
        data = request.get_json() or {}
        brand_name = (data.get("name") or "").strip()
        category_ids = data.get("category_ids", [])

        if not brand_name:
            return jsonify(format_response(False, None, "Brand name is required")), 400

        if not isinstance(category_ids, list):
            return jsonify(format_response(False, None, "category_ids must be a list")), 400

        try:
            category_ids = list(dict.fromkeys(int(cat_id) for cat_id in category_ids))
        except (TypeError, ValueError):
            return (
                jsonify(format_response(False, None, "category_ids must contain valid integers")),
                400,
            )

        categories = []
        if category_ids:
            categories = Category.query.filter(Category.id.in_(category_ids)).all()
            if len(categories) != len(category_ids):
                return (
                    jsonify(format_response(False, None, "One or more category IDs are invalid")),
                    400,
                )

        # Check if brand already exists
        existing_brand = Brand.query.filter_by(name=brand_name).first()
        if existing_brand:
            return jsonify(format_response(False, None, "Brand already exists")), 400

        new_brand = Brand(name=brand_name)
        for category in categories:
            new_brand.categories.append(category)
        db.session.add(new_brand)
        db.session.commit()

        brand_data = {
            "id": new_brand.id,
            "name": new_brand.name,
            "categories": [{"id": category.id, "name": category.name} for category in categories],
        }

        return (
            jsonify(format_response(True, {"brand": brand_data}, "Brand created successfully")),
            201,
        )

    except Exception as e:
        logger.error(f"Error creating brand: {e}")
        return (
            jsonify(format_response(False, None, "An error occurred while creating the brand")),
            500,
        )


# ===========================================================================
# UPDATE BRAND BY ID
# ============================================================================
@brands_bp.route("/<int:brand_id>", methods=["PUT"])
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

        data = request.get_json() or {}
        new_name = data.get("name")
        category_ids = data.get("category_ids")

        if new_name is not None:
            new_name = new_name.strip()
            if not new_name:
                return jsonify(format_response(False, None, "Brand name cannot be empty")), 400

            existing_brand = Brand.query.filter(
                Brand.name == new_name, Brand.id != brand.id
            ).first()
            if existing_brand:
                return jsonify(format_response(False, None, "Brand already exists")), 400

            brand.name = new_name

        if category_ids is not None:
            if not isinstance(category_ids, list):
                return jsonify(format_response(False, None, "category_ids must be a list")), 400

            try:
                category_ids = list(dict.fromkeys(int(cat_id) for cat_id in category_ids))
            except (TypeError, ValueError):
                return (
                    jsonify(
                        format_response(False, None, "category_ids must contain valid integers")
                    ),
                    400,
                )

            categories = []
            if category_ids:
                categories = Category.query.filter(Category.id.in_(category_ids)).all()
                if len(categories) != len(category_ids):
                    return (
                        jsonify(
                            format_response(False, None, "One or more category IDs are invalid")
                        ),
                        400,
                    )

            for existing_category in brand.categories.all():
                brand.categories.remove(existing_category)

            for category in categories:
                brand.categories.append(category)

        db.session.commit()

        brand_data = {
            "id": brand.id,
            "name": brand.name,
            "categories": [
                {"id": category.id, "name": category.name} for category in brand.categories.all()
            ],
        }

        return (
            jsonify(format_response(True, {"brand": brand_data}, "Brand updated successfully")),
            200,
        )

    except Exception as e:
        logger.error(f"Error updating brand: {e}")
        return (
            jsonify(format_response(False, None, "An error occurred while updating the brand")),
            500,
        )


# ============================================================================
# DELETE BRAND BY ID
# ============================================================================
@brands_bp.route("/<int:brand_id>", methods=["DELETE"])
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
        return (
            jsonify(format_response(False, None, "An error occurred while deleting the brand")),
            500,
        )
