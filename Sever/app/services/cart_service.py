"""
Cart Service
Handles shopping cart operations
"""
import logging
from collections import defaultdict
from app.extensions import db
from app.models import Cart, CartItem, Product

logger = logging.getLogger(__name__)


class CartService:
    """Service for managing shopping carts"""

    @staticmethod
    def get_or_create_cart(user_id):
        """
        Get user's cart or create if doesn't exist

        Args:
            user_id: ID of the user

        Returns:
            Cart object
        """
        cart = Cart.query.filter_by(user_id=user_id).first()

        if not cart:
            cart = Cart(user_id=user_id)
            db.session.add(cart)
            db.session.commit()
            logger.info(f"Created new cart for user {user_id}")

        return cart

    @staticmethod
    def get_cart_contents(user_id):
        """
        Get cart contents grouped by product

        Args:
            user_id: ID of the user

        Returns:
            Dictionary of cart items grouped by product_id
        """
        try:
            cart = Cart.query.filter_by(user_id=user_id).first()

            if not cart or not cart.items:
                return {}

            # Group items by product_id and variation
            grouped_items = defaultdict(dict)
            for item in cart.items:
                variation_name = item.variation_name or None
                grouped_items[item.product_id][variation_name] = {
                    "quantity": item.quantity,
                    "price": float(item.variation_price) if item.variation_price else float(item.product.price)
                }

            return dict(grouped_items)

        except Exception as e:
            logger.error(f"Error fetching cart contents: {str(e)}")
            return {}

    @staticmethod
    def add_to_cart(user_id, product_id, quantity, variation_name=None, variation_price=None):
        """
        Add item to cart

        Args:
            user_id: ID of the user
            product_id: ID of the product
            quantity: Quantity to add
            variation_name: Optional variation (e.g., "8GB - 256GB")
            variation_price: Price for this variation

        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            # Validate product exists
            product = Product.query.get(product_id)
            if not product:
                return False, "Product not found"

            # Validate quantity
            if not isinstance(quantity, int) or quantity <= 0:
                return False, "Invalid quantity"

            # Get or create cart
            cart = CartService.get_or_create_cart(user_id)

            # Check if item already exists
            cart_item = CartItem.query.filter_by(
                cart_id=cart.id,
                product_id=product_id,
                variation_name=variation_name
            ).first()

            if cart_item:
                # Update quantity
                cart_item.quantity += quantity
            else:
                # Create new cart item
                cart_item = CartItem(
                    cart_id=cart.id,
                    product_id=product_id,
                    quantity=quantity,
                    variation_name=variation_name,
                    variation_price=variation_price
                )
                db.session.add(cart_item)

            db.session.commit()

            logger.info(
                f"Added to cart: Product {product_id} x{quantity} for user {user_id}")
            return True, "Product added to cart successfully"

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error adding to cart: {str(e)}")
            return False, str(e)

    @staticmethod
    def update_cart_item(user_id, product_id, quantity, variation_name=None):
        """
        Update quantity of cart item

        Args:
            user_id: ID of the user
            product_id: ID of the product
            quantity: New quantity
            variation_name: Optional variation name

        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            cart = Cart.query.filter_by(user_id=user_id).first()
            if not cart:
                return False, "Cart not found"

            # Validate quantity
            if not isinstance(quantity, int) or quantity <= 0:
                return False, "Invalid quantity"

            # Find cart item
            cart_item = CartItem.query.filter_by(
                cart_id=cart.id,
                product_id=product_id,
                variation_name=variation_name
            ).first()

            if not cart_item:
                return False, "Cart item not found"

            # Update quantity
            cart_item.quantity = quantity
            db.session.commit()

            logger.info(
                f"Updated cart item: Product {product_id} to quantity {quantity}")
            return True, "Cart item updated successfully"

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating cart item: {str(e)}")
            return False, str(e)

    @staticmethod
    def remove_from_cart(user_id, product_id, variation_name=None):
        """
        Remove item from cart

        Args:
            user_id: ID of the user
            product_id: ID of the product
            variation_name: Optional variation name

        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            cart = Cart.query.filter_by(user_id=user_id).first()
            if not cart:
                return False, "Cart not found"

            # Find and delete cart item
            cart_item = CartItem.query.filter_by(
                cart_id=cart.id,
                product_id=product_id,
                variation_name=variation_name
            ).first()

            if not cart_item:
                return False, "Cart item not found"

            db.session.delete(cart_item)

            # Check if cart is empty and delete cart
            remaining_items = CartItem.query.filter_by(cart_id=cart.id).count()
            if remaining_items == 1:  # This one we're about to delete
                db.session.delete(cart)

            db.session.commit()

            logger.info(
                f"Removed from cart: Product {product_id} for user {user_id}")
            return True, "Cart item removed successfully"

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error removing from cart: {str(e)}")
            return False, str(e)

    @staticmethod
    def clear_cart(user_id):
        """
        Clear entire cart

        Args:
            user_id: ID of the user

        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            cart = Cart.query.filter_by(user_id=user_id).first()
            if not cart:
                return True, "Cart already empty"

            # Delete all items
            CartItem.query.filter_by(cart_id=cart.id).delete()

            # Delete cart
            db.session.delete(cart)
            db.session.commit()

            logger.info(f"Cleared cart for user {user_id}")
            return True, "Cart cleared successfully"

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error clearing cart: {str(e)}")
            return False, str(e)

    @staticmethod
    def get_cart_total(user_id):
        """
        Calculate total cart value

        Args:
            user_id: ID of the user

        Returns:
            float: Total cart value
        """
        try:
            cart = Cart.query.filter_by(user_id=user_id).first()
            if not cart:
                return 0.0

            total = 0.0
            for item in cart.items:
                price = float(item.variation_price) if item.variation_price else float(
                    item.product.price)
                total += price * item.quantity

            return round(total, 2)

        except Exception as e:
            logger.error(f"Error calculating cart total: {str(e)}")
            return 0.0
