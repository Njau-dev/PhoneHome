"""
Payments Routes Blueprint
Handles: M-Pesa STK Push, callback, payment retry, status check
"""
import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services import OrderService, MpesaService
from app.services.notification_service import create_notification
from app.models import Payment, Order
from app.extensions import db
from app.models import Cart
from app.utils.response_formatter import format_response

logger = logging.getLogger(__name__)

# Create blueprint
payments_bp = Blueprint('payments', __name__)


# ============================================================================
# INITIATE M-PESA PAYMENT
# ============================================================================
@payments_bp.route('/mpesa/initiate', methods=['POST'])
@jwt_required()
def initiate_mpesa_payment():
    """
    Initiate M-Pesa STK Push payment and create order

    Expected JSON:
    {
        "phone_number": "254712345678",
        "total_amount": 50000,
        "address": {
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com",
            "phone": "0712345678",
            "city": "Nairobi",
            "street": "123 Main St",
            "additionalInfo": "Near landmark"
        }
    }

    Requires: Valid JWT token

    Returns:
        201: Payment initiated, order created
        400: Invalid request or cart empty
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        logger.info(f"Initiating M-Pesa payment for user {current_user_id}")

        # Validate required fields
        required_fields = ['phone_number', 'total_amount', 'address']
        for field in required_fields:
            if field not in data:
                return jsonify(format_response(False, None, f"{field} is required")), 400

        cart = Cart.query.filter_by(user_id=current_user_id).first()
        if not cart or not cart.items:
            logger.warning(f"Empty cart for user {current_user_id}")
            return jsonify(format_response(False, None, "Cart is empty")), 400

        phone_number = data['phone_number']
        amount = float(data['total_amount'])

        # Validate amount
        if amount <= 0:
            return jsonify(format_response(False, None, "Amount must be greater than 0")), 400

        # Prepare order data
        order_data = {
            'address': data['address'],
            'payment_method': 'MPESA',
            'total_amount': amount
        }

        # Create order first (with Pending Payment status)
        order, error = OrderService.create_order(current_user_id, order_data)

        if error:
            return jsonify(format_response(False, None, error)), 400

        order_reference = order.order_reference
        logger.info(f"Order created: {order_reference}")

        # Initiate STK Push
        result = MpesaService.initiate_payment(
            MpesaService(),
            phone_number=phone_number,
            amount=amount,
            order_reference=order_reference
        )

        if not result["success"]:
            logger.error(f"STK Push failed: {result.get('error')}")
            # Update order status to failed
            order.status = 'Payment Failed'
            db.session.commit()
            return jsonify(format_response(False, None, result["error"])), 400

        # Update payment record with STK push details
        payment = order.payment
        payment.phone_number = phone_number
        payment.checkout_request_id = result["checkout_request_id"]
        payment.merchant_request_id = result["merchant_request_id"]
        db.session.commit()

        # Create notification
        create_notification(
            current_user_id,
            f"Order #{order_reference} created. Please complete M-Pesa payment on your phone."
        )

        logger.info(f"STK Push initiated for order {order_reference}")

        return jsonify(format_response(True, {
            "order_reference": order_reference,
            "checkout_request_id": result["checkout_request_id"]
        }, "Order created successfully. Please check your phone for M-Pesa prompt.")), 201

    except Exception as e:
        logger.error(f"M-Pesa payment initiation failed: {str(e)}")
        return jsonify(format_response(False, None, "Payment initiation failed")), 500


# ============================================================================
# M-PESA CALLBACK
# ============================================================================
@payments_bp.route('/ganji/inaflow', methods=['POST'])
def mpesa_callback():
    """
    Handle M-Pesa STK Push callback

    This endpoint is called by Safaricom after payment attempt
    No authentication required (Safaricom calls this)

    Returns:
        200: Callback processed
    """
    try:
        callback_data = request.get_json()
        logger.info(f"M-Pesa Callback received: {callback_data}")

        # Extract callback data
        stk_callback = callback_data.get("Body", {}).get("stkCallback", {})

        merchant_request_id = stk_callback.get("MerchantRequestID")
        checkout_request_id = stk_callback.get("CheckoutRequestID")
        result_code = stk_callback.get("ResultCode")
        result_desc = stk_callback.get("ResultDesc")

        if not checkout_request_id:
            logger.error("No CheckoutRequestID in callback")
            return jsonify(format_response(False, {"ResultCode": 1, "ResultDesc": "Invalid callback data"}, "Invalid callback data")), 400

        # Find payment record
        payment = Payment.query.filter_by(
            checkout_request_id=checkout_request_id).first()
        if not payment:
            logger.error(
                f"Payment not found for CheckoutRequestID: {checkout_request_id}")
            return jsonify(format_response(False, {"ResultCode": 1, "ResultDesc": "Payment record not found"}, "Payment record not found")), 404

        # Prepare payment data for service
        payment_data = {
            'result_code': str(result_code),
            'result_desc': result_desc
        }

        if result_code == 0:  # Success
            # Extract transaction details
            callback_metadata = stk_callback.get(
                "CallbackMetadata", {}).get("Item", [])

            for item in callback_metadata:
                name = item.get("Name")
                value = item.get("Value")

                if name == "MpesaReceiptNumber":
                    payment_data['mpesa_receipt'] = value
                    payment_data['transaction_id'] = value
                elif name == "PhoneNumber":
                    payment_data['phone_number'] = str(value)

            payment_data['status'] = 'Success'
        else:  # Payment Failed
            payment_data['status'] = 'Failed'

        # Update payment using service
        success, message = OrderService.update_payment_status(
            payment.order_reference,
            payment_data
        )

        if not success:
            logger.error(f"Failed to update payment: {message}")

        # Return success response to callback
        return jsonify(format_response(True, {"message": "Callback processed successfully"}, "Callback processed successfully")), 200

    except Exception as e:
        logger.error(f"M-Pesa callback processing failed: {str(e)}")
        return jsonify(format_response(False, None, "Callback processing failed")), 500


# ============================================================================
# RETRY M-PESA PAYMENT
# ============================================================================
@payments_bp.route('/mpesa/retry', methods=['POST'])
@jwt_required()
def retry_mpesa_payment():
    """
    Retry M-Pesa STK Push for failed payment

    Expected JSON:
    {
        "phone_number": "254712345678",
        "order_reference": "PHK-001"
    }

    Requires: Valid JWT token

    Returns:
        200: Payment retry initiated
        400: Invalid request
        403: Unauthorized
        404: Order not found
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        logger.info(f"Retrying M-Pesa payment for user {current_user_id}")

        # Validate required fields
        if not data or 'phone_number' not in data or 'order_reference' not in data:
            return jsonify(format_response(False, None, "phone_number and order_reference are required")), 400

        order_reference = data['order_reference']
        phone_number = data['phone_number']

        # Find order and verify ownership
        order = Order.query.filter_by(order_reference=order_reference).first()
        if not order:
            logger.warning(f"Order {order_reference} not found for retry")
            return jsonify(format_response(False, None, "Order not found")), 404

        if str(order.user_id) != current_user_id:
            logger.warning(
                f"Unauthorized retry attempt for order {order_reference}")
            return jsonify(format_response(False, None, "Unauthorized access to order")), 403

        # Check if order can be retried
        if order.status not in ['Pending Payment', 'Payment Failed']:
            logger.warning(
                f"Cannot retry payment for order {order_reference} with status {order.status}")
            return jsonify(format_response(False, None, "Order payment cannot be retried")), 400

        payment = order.payment
        if not payment:
            logger.error(
                f"No payment record found for order {order_reference}")
            return jsonify(format_response(False, None, "No payment record found")), 404

        amount = payment.amount

        # Initiate new STK Push
        result = MpesaService.initiate_payment(
            MpesaService(),
            phone_number=phone_number,
            amount=amount,
            order_reference=order_reference
        )

        if not result["success"]:
            logger.error(f"STK Push retry failed: {result.get('error')}")
            return jsonify(format_response(False, None, result["error"])), 400

        # Update payment record with new STK push details
        payment.phone_number = phone_number
        payment.status = "Pending"
        payment.checkout_request_id = result["checkout_request_id"]
        payment.merchant_request_id = result["merchant_request_id"]

        # Update order status
        order.status = 'Pending Payment'

        db.session.commit()

        # Create notification
        create_notification(
            current_user_id,
            f"Payment retry initiated for order #{order_reference}. Please complete M-Pesa payment."
        )

        logger.info(f"Payment retry initiated for order {order_reference}")

        return jsonify(format_response(True, {
            "order_reference": order_reference,
            "checkout_request_id": result["checkout_request_id"]
        }, "Payment retry initiated successfully. Please check your phone for M-Pesa prompt.")), 200

    except Exception as e:
        logger.error(f"M-Pesa payment retry failed: {str(e)}")
        return jsonify(format_response(False, None, "Payment retry failed")), 500


# ============================================================================
# GET PAYMENT STATUS
# ============================================================================
@payments_bp.route('/status/<string:order_reference>', methods=['GET'])
@jwt_required()
def get_payment_status(order_reference):
    """
    Check payment status for an order

    Args:
        order_reference: Order reference number

    Requires: Valid JWT token

    Returns:
        200: Payment status
        403: Unauthorized
        404: Order or payment not found
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()

        # Find order and verify ownership
        order = Order.query.filter_by(order_reference=order_reference).first()
        if not order:
            return jsonify(format_response(False, None, "Order not found")), 404

        if str(order.user_id) != current_user_id:
            return jsonify(format_response(False, None, "Unauthorized access")), 403

        payment = order.payment
        if not payment:
            return jsonify(format_response(False, None, "No payment record found")), 404

        payment_data = {
            "order_reference": order_reference,
            "payment_method": payment.payment_method,
            "payment_status": payment.status,
            "amount": float(payment.amount),
            "phone_number": payment.phone_number,
            "transaction_id": payment.transaction_id,
            "mpesa_receipt": payment.mpesa_receipt,
            "failure_reason": payment.failure_reason,
            "created_at": payment.created_at.isoformat(),
            "updated_at": payment.updated_at.isoformat()
        }
        return jsonify(format_response(True, payment_data, "Payment status fetched successfully")), 200

    except Exception as e:
        logger.error(f"Error fetching payment status: {str(e)}")
        return jsonify(format_response(False, None, "Failed to fetch payment status")), 500
