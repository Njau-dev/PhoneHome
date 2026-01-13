"""
Categories Routes Blueprint
Handles: categories CRUD operations
"""
import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.utils.decorators import admin_required
from app.models import Category, Product

logger = logging.getLogger(__name__)

# Create blueprint
categories_bp = Blueprint('categories', __name__)


# ============================================================================
# GET ALL CATEGORIES
# ============================================================================
@categories_bp.route('/', methods=['GET'])
def get_all_categories():
    """
    Get all product categories

    Returns:
        200: List of categories
        500: Server error
    """
    try:
        categories = Category.query.all()
        categories_data = [{"id": cat.id, "name": cat.name}
                           for cat in categories]

        return jsonify({"categories": categories_data}), 200

    except Exception as e:
        logger.error(f"Error fetching categories: {str(e)}")
        return jsonify({"error": "An error occurred while fetching categories"}), 500


# ===========================================================================
# GET CATEGORY BY ID
# ============================================================================
@categories_bp.route('/<int:category_id>', methods=['GET'])
def get_category_by_id(category_id):
    """
    Get a product category by ID

    Args:
        category_id: ID of the category

    Returns:
        200: Category data
        404: Category not found
        500: Server error
    """
    try:
        category = Category.query.get_or_404(category_id)

        if not category:
            return jsonify({"error": "Category not found"}), 404

        category_data = {"id": category.id, "name": category.name}
        return jsonify({"category": category_data}), 200

    except Exception as e:
        logger.error(f"Error fetching category: {str(e)}")
        return jsonify({"error": "An error occurred while fetching category"}), 500


# ============================================================================
# CREATE NEW CATEGORY
# ============================================================================
@categories_bp.route('/', methods=['POST'])
@jwt_required()
@admin_required
def create_category():
    """
    Create a new product category

    Requires: Valid JWT token and admin privileges

    Request JSON:
        {
            "name": "Category Name"
        }

    Returns:
        201: Created category data
        400: Validation error
        500: Server error
    """
    try:
        data = request.get_json()
        name = data.get('name')

        if not name:
            return jsonify({"error": "Category name is required"}), 400

        new_category = Category(name=name)
        db.session.add(new_category)
        db.session.commit()

        category_data = {"id": new_category.id, "name": new_category.name}
        return jsonify({"message": "Category created successfully", "data": category_data}), 201

    except Exception as e:
        logger.error(f"Error creating category: {str(e)}")
        return jsonify({"error": "An error occurred while creating category"}), 500


# ===========================================================================
# UPDATE CATEGORY
# ============================================================================
@categories_bp.route('/<int:category_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_category(category_id):
    """
    Update a product category by ID

    Requires: Valid JWT token and admin privileges

    Request JSON:
        {
            "name": "Updated Category Name"
        }

    Returns:
        200: Updated category data
        400: Validation error
        404: Category not found
        500: Server error
    """
    try:
        category = db.session.get(Category, category_id)

        if not category:
            return jsonify({"error": "Category not found"}), 404

        data = request.get_json()
        name = data.get('name')

        if not name:
            return jsonify({"error": "Category name is required"}), 400

        category.name = name
        db.session.commit()

        category_data = {"id": category.id, "name": category.name}
        return jsonify({"message": "Category updated successfully", "data": category_data}), 200

    except Exception as e:
        logger.error(f"Error updating category: {str(e)}")
        return jsonify({"error": "An error occurred while updating category"}), 500


# ============================================================================
# DELETE CATEGORY
# ============================================================================
@categories_bp.route('/<int:category_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_category(category_id):
    """
    Delete a product category by ID

    Requires: Valid JWT token and admin privileges

    Returns:
        200: Category deleted successfully
        404: Category not found
        500: Server error
    """
    try:
        category = db.session.get(Category, category_id)

        if not category:
            return jsonify({"error": "Category not found"}), 404

        # Check if any products are associated with this category
        associated_products = Product.query.filter_by(
            category_id=category_id).first()
        if associated_products:
            return jsonify({"error": "Cannot delete category with associated products"}), 400

        db.session.delete(category)
        db.session.commit()

        return jsonify({"message": "Category deleted successfully"}), 200

    except Exception as e:
        logger.error(f"Error deleting category: {str(e)}")
        return jsonify({"error": "An error occurred while deleting category"}), 500
