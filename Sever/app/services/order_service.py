"""
Order Service
Handles order creation, management, and status updates
"""
import logging

from app.extensions import db
from app.models import (
    Order, OrderItem, Address, Payment, Cart
)
from app.services.notification_service import create_notification
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)


class OrderService:
    """Service for managing orders"""

    ORDER_STATUSES = [
        "Order Placed",
        "Packing",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Canceled",
        "Pending Payment",
        "Payment Failed"
    ]

    @staticmethod
    def create_order(user_id, order_data):
        """
        Create a new order from cart

        Args:
            user_id: ID of the user
            order_data: Dictionary containing:
                - address: Address information
                - payment_method: 'COD' or 'MPESA'
                - total_amount: Total order amount

        Returns:
            tuple: (order_object, error_message)
        """
        try:
            # Validate cart exists and has items
            cart = Cart.query.filter_by(user_id=user_id).first()
            if not cart or not cart.items:
                return None, "Cart is empty"

            address_data = order_data.get('address') or {}
            required_address_fields = [
                'firstName', 'lastName', 'email', 'phone', 'city', 'street'
            ]
            missing_fields = [
                field for field in required_address_fields
                if not address_data.get(field)
            ]
            if missing_fields:
                return None, f"Invalid address: missing {', '.join(missing_fields)}"

            computed_total = 0
            for cart_item in cart.items:
                unit_price = cart_item.variation_price if cart_item.variation_price else (
                    cart_item.product.price if cart_item.product else 0
                )
                computed_total += float(unit_price) * cart_item.quantity

            requested_total = float(order_data.get('total_amount') or 0)
            if round(requested_total, 2) != round(computed_total, 2):
                return None, "Total amount does not match cart total"

            # Create address
            address = OrderService._create_address(
                user_id, address_data)
            if not address:
                return None, "Failed to create address"

            # Generate order reference
            order_reference = Order.generate_order_reference()

            # Create payment record
            payment = Payment(
                order_reference=order_reference,
                amount=order_data.get('total_amount'),
                payment_method=order_data.get('payment_method'),
                status='Pending'
            )
            db.session.add(payment)
            db.session.flush()  # Get payment ID

            # Determine initial order status
            initial_status = 'Order Placed' if order_data.get(
                'payment_method') == 'COD' else 'Pending Payment'

            # Create order
            order = Order(
                user_id=user_id,
                order_reference=order_reference,
                address_id=address.id,
                payment_id=payment.id,
                total_amount=order_data.get('total_amount'),
                status=initial_status
            )
            db.session.add(order)
            db.session.flush()  # Get order ID

            # Create order items from cart
            for cart_item in cart.items:
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=cart_item.product_id,
                    quantity=cart_item.quantity,
                    variation_name=cart_item.variation_name,
                    variation_price=cart_item.variation_price
                )
                db.session.add(order_item)

            # Clear cart
            for item in cart.items:
                db.session.delete(item)
            db.session.delete(cart)

            # Commit all changes
            db.session.commit()

            # Create notification
            if order_data.get('payment_method') == 'COD':
                message = f"Order #{order.order_reference} placed successfully. Payment on delivery."
            else:
                message = f"Order #{order.order_reference} created. Please complete M-Pesa payment."

            create_notification(user_id, message)

            logger.info(f"Order created: {order_reference} for user {user_id}")
            return order, None

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating order: {str(e)}")
            return None, str(e)

    @staticmethod
    def _create_address(user_id, address_data):
        """Create address from order data"""
        try:
            if not address_data:
                return None

            address = Address(
                user_id=user_id,
                first_name=address_data.get('firstName'),
                last_name=address_data.get('lastName'),
                email=address_data.get('email'),
                phone=address_data.get('phone'),
                city=address_data.get('city'),
                street=address_data.get('street'),
                additional_info=address_data.get('additionalInfo')
            )
            db.session.add(address)
            db.session.flush()
            return address

        except Exception as e:
            logger.error(f"Error creating address: {str(e)}")
            return None

    @staticmethod
    def get_user_orders(user_id):
        """
        Get all orders for a user

        Args:
            user_id: ID of the user

        Returns:
            List of order dictionaries
        """
        try:
            orders = Order.query.filter_by(user_id=user_id).order_by(
                Order.created_at.desc()
            ).all()

            return [OrderService._serialize_order(order) for order in orders]

        except Exception as e:
            logger.error(f"Error fetching user orders: {str(e)}")
            return []

    @staticmethod
    def get_order_by_reference(order_reference, user_id=None):
        """
        Get order by reference number

        Args:
            order_reference: Order reference number
            user_id: Optional user ID for ownership verification

        Returns:
            Order dictionary or None
        """
        try:
            query = Order.query.filter_by(order_reference=order_reference)

            if user_id:
                query = query.filter_by(user_id=user_id)

            order = query.first()

            if not order:
                return None

            return OrderService._serialize_order(order, detailed=True)

        except Exception as e:
            logger.error(f"Error fetching order {order_reference}: {str(e)}")
            return None

    @staticmethod
    def _serialize_order(order, detailed=False):
        """Convert order to dictionary"""
        data = {
            "id": order.id,
            "order_reference": order.order_reference,
            "total_amount": float(order.total_amount),
            "status": order.status,
            "created_at": order.created_at.isoformat(),
            "updated_at": order.updated_at.isoformat(),
        }

        # Add items
        data["items"] = [
            {
                "product_id": item.product_id,
                "name": item.product.name if item.product else None,
                "image_url": item.product.image_urls[0] if item.product and item.product.image_urls else None,
                "brand": item.product.brand.name if item.product and item.product.brand else None,
                "quantity": item.quantity,
                "variation_name": item.variation_name,
                "price": float(item.variation_price) if item.variation_price else float(item.product.price) if item.product else 0
            }
            for item in order.order_items
        ]

        # Add payment info
        if order.payment:
            data["payment"] = {
                "method": order.payment.payment_method,
                "status": order.payment.status,
                "failure_reason": order.payment.failure_reason,
                "checkout_request_id": order.payment.checkout_request_id,
                "transaction_id": order.payment.transaction_id,
                "mpesa_receipt": order.payment.mpesa_receipt
            }

        # Add detailed info if requested
        if detailed and order.address:
            data["address"] = {
                "first_name": order.address.first_name,
                "last_name": order.address.last_name,
                "email": order.address.email,
                "phone": order.address.phone,
                "city": order.address.city,
                "street": order.address.street,
                "additional_info": order.address.additional_info
            }

        return data

    @staticmethod
    def update_order_status(order_id, new_status, admin_id=None):
        """
        Update order status (admin only)

        Args:
            order_id: ID of the order
            new_status: New status string
            admin_id: ID of admin making the change

        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            # Validate status
            if new_status not in OrderService.ORDER_STATUSES:
                return False, f"Invalid status. Must be one of: {', '.join(OrderService.ORDER_STATUSES)}"

            order = Order.query.get(order_id)
            if not order:
                return False, "Order not found"

            old_status = order.status
            order.status = new_status

            # If delivered, mark payment as success
            if new_status == "Delivered" and order.payment:
                order.payment.status = "Success"

                # Send payment confirmation
                try:
                    EmailService().send_payment_notification(order.payment)
                except Exception as email_error:
                    logger.warning(
                        f"Failed to send payment notification for {order.order_reference}: {email_error}"
                    )

                create_notification(
                    order.user_id,
                    f"Payment for Order #{order.order_reference} confirmed. Check your email for receipt."
                )

            db.session.commit()

            # Send notifications
            create_notification(
                order.user_id,
                f"Order #{order.order_reference} status updated to {new_status}. Check your email for details."
            )

            # Send email update (best-effort; should not fail order status update)
            try:
                email_service = EmailService()
                email_service.send_shipment_update(order, old_status, new_status)
            except Exception as email_error:
                logger.warning(
                    f"Failed to send shipment update email for {order.order_reference}: {email_error}"
                )

            logger.info(
                f"Order {order.order_reference} status updated: {old_status} -> {new_status}")
            return True, f"Order status updated to {new_status}"

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating order status: {str(e)}")
            return False, str(e)

    @staticmethod
    def get_all_orders():
        """
        Get all orders (admin only)

        Returns:
            List of order dictionaries
        """
        try:
            orders = Order.query.order_by(Order.created_at.desc()).all()
            return [OrderService._serialize_order(order, detailed=True) for order in orders]
        except Exception as e:
            logger.error(f"Error fetching all orders: {str(e)}")
            return []

    @staticmethod
    def update_payment_status(order_reference, payment_data):
        """
        Update payment status (for M-Pesa callback)

        Args:
            order_reference: Order reference number
            payment_data: Dictionary with payment update info
                - status: 'Success' or 'Failed'
                - transaction_id: M-Pesa transaction ID
                - mpesa_receipt: Receipt number
                - result_code: Result code from M-Pesa
                - result_desc: Result description

        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            order = Order.query.filter_by(
                order_reference=order_reference).first()
            if not order or not order.payment:
                return False, "Order or payment not found"

            payment = order.payment
            payment.status = payment_data.get('status', 'Failed')
            payment.transaction_id = payment_data.get('transaction_id')
            payment.mpesa_receipt = payment_data.get('mpesa_receipt')
            payment.result_code = payment_data.get('result_code')
            payment.result_desc = payment_data.get('result_desc')

            if payment.status == 'Success':
                # Update order status
                order.status = 'Order Placed'

                # Send confirmation email
                EmailService().send_order_confirmation(order)

                create_notification(
                    order.user_id,
                    f"Payment successful for Order #{order.order_reference}. Receipt: {payment.mpesa_receipt}"
                )
            else:
                order.status = 'Payment Failed'

                create_notification(
                    order.user_id,
                    f"Payment failed for Order #{order.order_reference}. {payment.result_desc}"
                )

            db.session.commit()

            logger.info(
                f"Payment status updated for order {order_reference}: {payment.status}")
            return True, "Payment status updated"

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating payment status: {str(e)}")
            return False, str(e)
