"""
Products Routes Blueprint
Handles: product CRUD, listing, filtering, variations
"""
import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app.utils.decorators import admin_required
from app.services import ProductService
from app.models import Product, Category
from app.utils.response_formatter import format_response

logger = logging.getLogger(__name__)

# Create blueprint
products_bp = Blueprint('products', __name__)


# ============================================================================
# GET ALL PRODUCTS
# ============================================================================
@products_bp.route('/', methods=['GET'])
def get_products():
    """
    Get all products with optional filtering
    Query Parameters:
        type: Filter by product type (phone, laptop, tablet, audio)
        category: Filter by category ID
        brand: Filter by brand ID
        best_seller: Filter for best sellers (true/false)
        limit: Limit number of results
        sort: Sort order (newest, oldest, price_asc, price_desc)
    Returns:
        200: List of products
        500: Server error
    """
    try:
        # Get all products
        products = ProductService.get_all_products()

        # Filter by type if specified
        product_type = request.args.get('type')
        if product_type:
            products = [p for p in products if p['type'] == product_type]

        # Filter by category if specified
        category = request.args.get('category')
        if category:
            products = [p for p in products if p['category'] == category]

        # Filter by brand if specified
        brand = request.args.get('brand')
        if brand:
            try:
                brand_id = int(brand)
                products = [p for p in products if p.get(
                    'brand_id') == brand_id]
            except ValueError:
                pass

        # Filter by best seller if specified
        best_seller = request.args.get('best_seller')
        if best_seller and best_seller.lower() == 'true':
            products = [p for p in products if p.get('isBestSeller', False)]

        # Sort products
        sort = request.args.get('sort', 'newest')
        if sort == 'newest':
            products.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        elif sort == 'oldest':
            products.sort(key=lambda x: x.get('created_at', ''))
        elif sort == 'price_asc':
            products.sort(key=lambda x: x.get('price', 0))
        elif sort == 'price_desc':
            products.sort(key=lambda x: x.get('price', 0), reverse=True)

        # Limit results if specified
        limit = request.args.get('limit')
        if limit:
            try:
                limit = int(limit)
                products = products[:limit]
            except ValueError:
                pass

        return jsonify(format_response(True, {"products": products}, "Products fetched successfully")), 200
    except Exception as e:
        logger.error(f"Error fetching products: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while fetching products")), 500


# ============================================================================
# GET SINGLE PRODUCT
# ============================================================================
@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """
    Get single product by ID with full details

    Args:
        product_id: ID of the product

    Returns:
        200: Product details
        404: Product not found
        500: Server error
    """
    try:
        product = ProductService.get_product_by_id(product_id)

        if not product:
            return jsonify(format_response(False, None, "Product not found")), 404

        return jsonify(format_response(True, {"product": product}, "Product fetched successfully")), 200

    except Exception as e:
        logger.error(f"Error fetching product {product_id}: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while fetching the product")), 500


# ============================================================================
# CREATE PRODUCT (ADMIN ONLY)
# ============================================================================
@products_bp.route('/', methods=['POST'])
@jwt_required()
@admin_required
def create_product():
    """
    Create a new product (Admin only)

    Form Data:
        name: Product name
        price: Product price
        description: Product description
        category_id: Category ID
        brand_id: Brand ID
        type: Product type (phone, laptop, tablet, audio)
        image_urls: List of image files
        hasVariation: Boolean (optional)
        isBestSeller: Boolean (optional)
        variations: JSON array of variations (optional)
        ... type-specific fields

    Returns:
        201: Product created successfully
        400: Missing required fields or validation error
        403: Admin privileges required
        500: Server error
    """
    try:
        # Validate required fields
        required_fields = ['name', 'price', 'description',
                           'category_id', 'brand_id', 'type']
        for field in required_fields:
            if not request.form.get(field):
                return jsonify(format_response(False, None, f"Missing required field: {field}")), 400

        # Get image files
        image_files = request.files.getlist('image_urls')
        if not image_files:
            return jsonify(format_response(False, None, "At least one product image is required")), 400

        # Prepare product data
        product_data = {
            'name': request.form.get('name'),
            'price': request.form.get('price'),
            'description': request.form.get('description'),
            'category_id': request.form.get('category_id'),
            'brand_id': request.form.get('brand_id'),
            'type': request.form.get('type'),
            'hasVariation': request.form.get('hasVariation', 'false').lower() == 'true',
            'isBestSeller': request.form.get('isBestSeller', 'false').lower() == 'true',
            'variations': request.form.get('variations')  # JSON string
        }

        # Add type-specific fields
        product_type = product_data['type']
        if product_type in ['phone', 'tablet']:
            product_data.update({
                'ram': request.form.get('ram'),
                'storage': request.form.get('storage'),
                'battery': request.form.get('battery'),
                'main_camera': request.form.get('main_camera'),
                'front_camera': request.form.get('front_camera'),
                'display': request.form.get('display'),
                'processor': request.form.get('processor'),
                'connectivity': request.form.get('connectivity'),
                'colors': request.form.get('colors'),
                'os': request.form.get('os')
            })
        elif product_type == 'laptop':
            product_data.update({
                'ram': request.form.get('ram'),
                'storage': request.form.get('storage'),
                'battery': request.form.get('battery'),
                'display': request.form.get('display'),
                'processor': request.form.get('processor'),
                'os': request.form.get('os')
            })
        elif product_type == 'audio':
            product_data['battery'] = request.form.get('battery')

        # Create product using service
        product, error = ProductService.create_product(
            product_data, image_files)

        if error:
            return jsonify(format_response(False, None, error)), 400

        logger.info(f"Product created: {product.name} (ID: {product.id})")
        return jsonify(format_response(True, {"product": ProductService.get_product_by_id(product.id)}, f"{product_type.capitalize()} added successfully!")), 201

    except Exception as e:
        logger.error(f"Error creating product: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while creating the product")), 500


# ============================================================================
# UPDATE PRODUCT (ADMIN ONLY)
# ============================================================================
@products_bp.route('/<int:product_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_product(product_id):
    """
    Update an existing product (Admin only)

    Args:
        product_id: ID of product to update

    Form Data:
        Same as create, all fields optional

    Returns:
        200: Product updated successfully
        403: Admin privileges required
        404: Product not found
        500: Server error
    """
    try:
        # Prepare update data (only include provided fields)
        product_data = {}

        # Basic fields
        for field in ['name', 'price', 'description', 'category_id', 'brand_id']:
            if request.form.get(field):
                product_data[field] = request.form.get(field)

        # Boolean fields
        if 'hasVariation' in request.form:
            product_data['hasVariation'] = request.form.get(
                'hasVariation', 'false').lower() == 'true'
        if 'isBestSeller' in request.form:
            product_data['isBestSeller'] = request.form.get(
                'isBestSeller', 'false').lower() == 'true'

        # Variations
        if request.form.get('variations'):
            product_data['variations'] = request.form.get('variations')

        # Type-specific fields (add any that are provided)
        type_specific_fields = [
            'ram', 'storage', 'battery', 'main_camera', 'front_camera',
            'display', 'processor', 'connectivity', 'colors', 'os'
        ]
        for field in type_specific_fields:
            if request.form.get(field):
                product_data[field] = request.form.get(field)

        # Get new images if provided
        new_image_files = request.files.getlist('image_urls')

        # Update product using service
        product, error = ProductService.update_product(
            product_id,
            product_data,
            new_image_files if new_image_files else None
        )

        if error:
            return jsonify(format_response(False, None, error)), 400 if "not found" not in error.lower() else 404

        logger.info(f"Product updated: {product.name} (ID: {product_id})")
        return jsonify(format_response(True, {"product": ProductService.get_product_by_id(product_id)}, "Product updated successfully")), 200

    except Exception as e:
        logger.error(f"Error updating product {product_id}: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while updating the product")), 500


# ============================================================================
# DELETE PRODUCT (ADMIN ONLY)
# ============================================================================
@products_bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_product(product_id):
    """
    Delete a product (Admin only)

    Args:
        product_id: ID of product to delete

    Returns:
        200: Product deleted successfully
        403: Admin privileges required
        404: Product not found
        500: Server error
    """
    try:
        success, error = ProductService.delete_product(product_id)

        if not success:
            status_code = 404 if "not found" in error.lower() else 500
            return jsonify(format_response(False, None, error)), status_code

        logger.info(f"Product deleted: ID {product_id}")
        return jsonify(format_response(True, None, "Product deleted successfully")), 200

    except Exception as e:
        logger.error(f"Error deleting product {product_id}: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while deleting the product")), 500


# ============================================================================
# GET PRODUCTS BY TYPE
# ============================================================================
@products_bp.route('/type/<string:product_type>', methods=['GET'])
def get_products_by_type(product_type):
    """
    Get products filtered by type

    Args:
        product_type: Type of product (phone, laptop, tablet, audio)

    Returns:
        200: List of products of specified type
        400: Invalid product type
        500: Server error
    """
    try:
        valid_types = ['phone', 'laptop', 'tablet', 'audio']
        if product_type not in valid_types:
            return jsonify(format_response(False, None, f"Invalid product type. Must be one of: {', '.join(valid_types)}")), 400

        products = ProductService.get_all_products()
        filtered_products = [p for p in products if p['type'] == product_type]

        return jsonify(format_response(True, {"products": filtered_products}, "Products fetched successfully")), 200

    except Exception as e:
        logger.error(f"Error fetching products by type: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while retrieving products")), 500


# ============================================================================
# GET PRODUCTS BY CATEGORY
# ============================================================================
@products_bp.route('/category/<int:category_id>', methods=['GET'])
def get_products_by_category(category_id):
    """
    Get products filtered by category

    Args:
        category_id: ID of the category

    Returns:
        200: List of products in specified category
        500: Server error
    """
    try:
        category = Category.query.get(category_id)
        if not category:
            return jsonify(format_response(False, None, "Category not found")), 404

        products = ProductService.get_all_products()
        filtered_products = [p for p in products if p.get(
            'category') == category.name]

        return jsonify(format_response(True, {"products": filtered_products}, "Products fetched successfully")), 200

    except Exception as e:
        logger.error(f"Error fetching products by category: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while retrieving products")), 500


# ============================================================================
# ADD/UPDATE PRODUCT VARIATIONS (ADMIN ONLY)
# ============================================================================
@products_bp.route('/<int:product_id>/variations', methods=['POST'])
@jwt_required()
@admin_required
def add_product_variations(product_id):
    """
    Add variations to a product (Admin only)

    Args:
        product_id: ID of the product

    Expected JSON:
    {
        "variations": [
            {"ram": "8GB", "storage": "256GB", "price": 50000},
            {"ram": "12GB", "storage": "512GB", "price": 60000}
        ]
    }

    Returns:
        201: Variations added successfully
        400: Invalid data
        403: Admin privileges required
        404: Product not found
        500: Server error
    """
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify(format_response(False, None, "Product not found")), 404

        data = request.get_json()
        if not data or 'variations' not in data:
            return jsonify(format_response(False, None, "Variations data is required")), 400

        # Update the product's variations
        product_data = {
            'hasVariation': True,
            'variations': data['variations']
        }

        product, error = ProductService.update_product(
            product_id, product_data)

        if error:
            return jsonify(format_response(False, None, error)), 400

        logger.info(f"Variations added to product {product_id}")
        return jsonify(format_response(True, None, "Variations added successfully!")), 201

    except Exception as e:
        logger.error(f"Error adding variations: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while adding variations")), 500
