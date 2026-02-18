"""
Product Service
Handles all product-related business logic
"""

import json
import logging

from app.extensions import db
from app.models import (
    Audio,
    Brand,
    Category,
    Laptop,
    Phone,
    Product,
    ProductVariation,
    Review,
    Tablet,
)
from app.services.cloudinary_service import upload_images

logger = logging.getLogger(__name__)


class ProductService:
    """Service for managing products"""

    # Map product types to model classes
    PRODUCT_TYPE_MAP = {"phone": Phone, "laptop": Laptop, "tablet": Tablet, "audio": Audio}

    @staticmethod
    def create_product(product_data, image_files):
        """
        Create a new product with images

        Args:
            product_data: Dictionary with product information
            image_files: List of image files to upload

        Returns:
            tuple: (product_object, error_message)
        """
        try:
            # Upload images first
            success, result = upload_images(image_files)
            if not success:
                return None, result

            image_urls = result

            # Get product type
            product_type = product_data.get("type")
            if product_type not in ProductService.PRODUCT_TYPE_MAP:
                return None, f"Invalid product type: {product_type}"

            ProductModel = ProductService.PRODUCT_TYPE_MAP[product_type]

            # Verify category and brand exist
            category = Category.query.get(product_data.get("category_id"))
            if not category:
                return None, "Invalid category ID"

            brand = Brand.query.get(product_data.get("brand_id"))
            if not brand:
                return None, "Invalid brand ID"

            # Create product instance
            product = ProductService._build_product_instance(ProductModel, product_data, image_urls)

            db.session.add(product)
            db.session.flush()  # Get product ID for variations

            # Handle variations if hasVariation is True
            if product_data.get("hasVariation", False):
                variations_json = product_data.get("variations")
                if variations_json:
                    ProductService._create_variations(product.id, variations_json)

            db.session.commit()

            logger.info(f"Product created: {product.name} (ID: {product.id})")
            return product, None

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating product: {str(e)}")
            return None, str(e)

    @staticmethod
    def _build_product_instance(ProductModel, data, image_urls):
        """Build product instance based on type"""
        base_fields = {
            "name": data.get("name"),
            "price": float(data.get("price")),
            "description": data.get("description"),
            "image_urls": image_urls,
            "category_id": data.get("category_id"),
            "brand_id": data.get("brand_id"),
            "hasVariation": data.get("hasVariation", False),
            "isBestSeller": data.get("isBestSeller", False),
        }

        # Add type-specific fields
        if ProductModel in [Phone, Tablet]:
            base_fields.update(
                {
                    "ram": data.get("ram"),
                    "storage": data.get("storage"),
                    "battery": data.get("battery"),
                    "main_camera": data.get("main_camera"),
                    "front_camera": data.get("front_camera"),
                    "display": data.get("display"),
                    "processor": data.get("processor"),
                    "connectivity": data.get("connectivity"),
                    "colors": data.get("colors"),
                    "os": data.get("os"),
                }
            )
        elif ProductModel == Laptop:
            base_fields.update(
                {
                    "ram": data.get("ram"),
                    "storage": data.get("storage"),
                    "battery": data.get("battery"),
                    "display": data.get("display"),
                    "processor": data.get("processor"),
                    "os": data.get("os"),
                }
            )
        elif ProductModel == Audio:
            base_fields.update({"battery": data.get("battery")})

        return ProductModel(**base_fields)

    @staticmethod
    def _create_variations(product_id, variations_json):
        """Create product variations"""
        try:
            variations_list = (
                json.loads(variations_json) if isinstance(variations_json, str) else variations_json
            )

            for variation in variations_list:
                new_variation = ProductVariation(
                    product_id=product_id,
                    ram=variation.get("ram"),
                    storage=variation.get("storage"),
                    price=float(variation.get("price", 0)),
                )
                db.session.add(new_variation)

        except Exception as e:
            logger.error(f"Error creating variations: {str(e)}")
            raise

    @staticmethod
    def update_product(product_id, product_data, new_image_files=None):
        """
        Update an existing product

        Args:
            product_id: ID of product to update
            product_data: Dictionary with updated information
            new_image_files: Optional list of new image files

        Returns:
            tuple: (product_object, error_message)
        """
        try:
            product = Product.query.get(product_id)
            if not product:
                return None, "Product not found"

            # Update images if provided
            if new_image_files:
                success, result = upload_images(new_image_files)
                if success:
                    # Append new images to existing
                    product.image_urls.extend(result)

            # Update basic fields
            if "name" in product_data:
                product.name = product_data["name"]
            if "price" in product_data:
                product.price = float(product_data["price"])
            if "description" in product_data:
                product.description = product_data["description"]
            if "category_id" in product_data:
                product.category_id = product_data["category_id"]
            if "brand_id" in product_data:
                product.brand_id = product_data["brand_id"]
            if "isBestSeller" in product_data:
                product.isBestSeller = product_data["isBestSeller"]
            if "hasVariation" in product_data:
                product.hasVariation = product_data["hasVariation"]

            # Update type-specific fields
            ProductService._update_type_specific_fields(product, product_data)

            # Update variations if provided
            if product.hasVariation and "variations" in product_data:
                ProductService._update_variations(product.id, product_data["variations"])

            db.session.commit()

            logger.info(f"Product updated: {product.name} (ID: {product.id})")
            return product, None

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating product: {str(e)}")
            return None, str(e)

    @staticmethod
    def _update_type_specific_fields(product, data):
        """Update fields specific to product type"""
        if isinstance(product, Phone | Tablet):
            for field in [
                "ram",
                "storage",
                "battery",
                "main_camera",
                "front_camera",
                "display",
                "processor",
                "connectivity",
                "colors",
                "os",
            ]:
                if field in data:
                    setattr(product, field, data[field])
        elif isinstance(product, Laptop):
            for field in ["ram", "storage", "battery", "display", "processor", "os"]:
                if field in data:
                    setattr(product, field, data[field])
        elif isinstance(product, Audio):
            if "battery" in data:
                product.battery = data["battery"]

    @staticmethod
    def _update_variations(product_id, variations_data):
        """Update product variations"""
        try:
            variations_list = (
                json.loads(variations_data) if isinstance(variations_data, str) else variations_data
            )

            for variation_data in variations_list:
                ram = variation_data.get("ram")
                storage = variation_data.get("storage")
                price = float(variation_data.get("price", 0))

                # Find existing or create new
                existing = ProductVariation.query.filter_by(
                    product_id=product_id, ram=ram, storage=storage
                ).first()

                if existing:
                    existing.price = price
                else:
                    new_variation = ProductVariation(
                        product_id=product_id, ram=ram, storage=storage, price=price
                    )
                    db.session.add(new_variation)

        except Exception as e:
            logger.error(f"Error updating variations: {str(e)}")
            raise

    @staticmethod
    def get_all_products():
        """
        Get all products with ratings

        Returns:
            List of product dictionaries
        """
        try:
            products = Product.query.all()
            return [ProductService._serialize_product(p) for p in products]
        except Exception as e:
            logger.error(f"Error fetching products: {str(e)}")
            return []

    @staticmethod
    def get_product_by_id(product_id):
        """
        Get single product with full details

        Args:
            product_id: ID of the product

        Returns:
            Product dictionary or None
        """
        try:
            product = Product.query.get(product_id)
            if not product:
                return None

            return ProductService._serialize_product(product, include_reviews=True)
        except Exception as e:
            logger.error(f"Error fetching product {product_id}: {str(e)}")
            return None

    @staticmethod
    def _serialize_product(product, include_reviews=False):
        """Convert product to dictionary"""
        # Calculate average rating
        reviews = Review.query.filter_by(product_id=product.id).all()
        avg_rating = 0
        if reviews:
            avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 1)

        data = {
            "id": product.id,
            "name": product.name,
            "price": float(product.price),
            "description": product.description,
            "image_urls": product.image_urls,
            "category": product.category.name,
            "category_id": product.category.id,
            "brand": product.brand.name,
            "brand_id": product.brand.id,
            "type": product.type,
            "hasVariation": product.hasVariation,
            "isBestSeller": product.isBestSeller,
            "rating": avg_rating,
            "review_count": len(reviews),
        }

        # Add variations if available
        if product.hasVariation:
            data["variations"] = [
                {"id": v.id, "ram": v.ram, "storage": v.storage, "price": float(v.price)}
                for v in product.variations
            ]

        # Add type-specific fields
        ProductService._add_type_specific_fields(product, data)

        # Add reviews if requested
        if include_reviews:
            data["reviews"] = ProductService._serialize_reviews(reviews)

        return data

    @staticmethod
    def _add_type_specific_fields(product, data):
        """Add type-specific fields to serialized data"""
        if isinstance(product, Phone | Tablet):
            data.update(
                {
                    "ram": product.ram,
                    "storage": product.storage,
                    "battery": product.battery,
                    "main_camera": product.main_camera,
                    "front_camera": product.front_camera,
                    "display": product.display,
                    "processor": product.processor,
                    "connectivity": product.connectivity,
                    "colors": product.colors,
                    "os": product.os,
                }
            )
        elif isinstance(product, Laptop):
            data.update(
                {
                    "ram": product.ram,
                    "storage": product.storage,
                    "battery": product.battery,
                    "display": product.display,
                    "processor": product.processor,
                    "os": product.os,
                }
            )
        elif isinstance(product, Audio):
            data["battery"] = product.battery

    @staticmethod
    def _serialize_reviews(reviews):
        """Serialize reviews"""
        from app.models import User

        serialized = []
        for review in reviews:
            user = User.query.get(review.user_id)
            serialized.append(
                {
                    "id": review.id,
                    "user_id": review.user_id,
                    "user_name": user.username if user else "Anonymous",
                    "rating": review.rating,
                    "comment": review.comment,
                    "created_at": review.created_at.isoformat(),
                }
            )
        return serialized

    @staticmethod
    def delete_product(product_id):
        """
        Delete a product and all related data

        Args:
            product_id: ID of product to delete

        Returns:
            tuple: (success: bool, error_message: str or None)
        """
        try:
            from app.models import CartItem, CompareItem, OrderItem, WishList

            product = Product.query.get(product_id)
            if not product:
                return False, "Product not found"

            # Delete related records
            CartItem.query.filter_by(product_id=product_id).delete()
            OrderItem.query.filter_by(product_id=product_id).delete()
            CompareItem.query.filter_by(product_id=product_id).delete()

            # Remove from wishlists
            wishlists = WishList.query.all()
            for wishlist in wishlists:
                if product in wishlist.products:
                    wishlist.products.remove(product)

            # Delete variations
            ProductVariation.query.filter_by(product_id=product_id).delete()

            # Delete reviews
            Review.query.filter_by(product_id=product_id).delete()

            # Delete product
            db.session.delete(product)
            db.session.commit()

            logger.info(f"Product deleted: {product.name} (ID: {product_id})")
            return True, None

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error deleting product {product_id}: {str(e)}")
            return False, str(e)
