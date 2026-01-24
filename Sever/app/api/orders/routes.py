"""
Orders Routes Blueprint
Handles: order creation, viewing orders, updating status, generating invoices/receipts
"""
import logging
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from io import BytesIO
from xhtml2pdf import pisa

from app.utils.decorators import admin_required
from app.services import OrderService
from app.models import Order
from app.utils.response_formatter import format_response

logger = logging.getLogger(__name__)

# Create blueprint
orders_bp = Blueprint('orders', __name__)


# ============================================================================
# GET USER ORDERS
# ============================================================================
@orders_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_orders():
    """
    Get all orders for current user

    Requires: Valid JWT token

    Returns:
        200: List of user's orders
        404: User not found
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()

        orders = OrderService.get_user_orders(current_user_id)

        return jsonify(format_response(True, {"orders": orders}, "Orders fetched successfully")), 200

    except Exception as e:
        logger.error(f"Error fetching user orders: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while fetching orders")), 500


# ============================================================================
# CREATE ORDER
# ============================================================================
@orders_bp.route('/', methods=['POST'])
@jwt_required()
def create_order():
    """
    Create a new order from cart

    Requires: Valid JWT token

    Expected JSON:
    {
        "address": {
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com",
            "phone": "0712345678",
            "city": "Nairobi",
            "street": "123 Main St",
            "additionalInfo": "Near landmark"
        },
        "payment_method": "COD",  // or "MPESA"
        "total_amount": 50000
    }

    Returns:
        201: Order created successfully
        400: Cart is empty or invalid data
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        # Validate required fields
        if not data:
            return jsonify(format_response(False, None, "Request body is required")), 400

        if 'address' not in data:
            return jsonify(format_response(False, None, "Address is required")), 400

        if 'payment_method' not in data:
            return jsonify(format_response(False, None, "Payment method is required")), 400

        if 'total_amount' not in data:
            return jsonify(format_response(False, None, "Total amount is required")), 400

        # Validate payment method
        valid_methods = ['COD', 'MPESA']
        if data['payment_method'] not in valid_methods:
            return jsonify(format_response(False, None, f"Payment method must be one of: {', '.join(valid_methods)}")), 400

        # Create order using service
        order, error = OrderService.create_order(current_user_id, data)

        if error:
            return jsonify(format_response(False, None, error)), 400

        logger.info(
            f"Order created: {order.order_reference} for user {current_user_id}")
        return jsonify(format_response(True, {"order_reference": order.order_reference}, "Order placed successfully")), 201

    except Exception as e:
        logger.error(f"Error creating order: {str(e)}")
        return jsonify(format_response(False, None, "Failed to create order")), 500


# ============================================================================
# GET ORDER BY REFERENCE
# ============================================================================
@orders_bp.route('/<string:order_reference>', methods=['GET'])
@jwt_required()
def get_order_by_reference(order_reference):
    """
    Get order details by reference number

    Args:
        order_reference: Order reference number (e.g., PHK-001)

    Requires: Valid JWT token

    Returns:
        200: Order details
        403: Unauthorized access
        404: Order not found
        500: Server error
    """
    try:
        current_user_id = get_jwt_identity()

        order = OrderService.get_order_by_reference(
            order_reference, current_user_id)

        if not order:
            return jsonify(format_response(False, None, "Order not found")), 404

        return jsonify(format_response(True, order, "Order fetched successfully")), 200

    except Exception as e:
        logger.error(f"Error fetching order {order_reference}: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while fetching order")), 500


# ============================================================================
# GET ALL ORDERS (ADMIN ONLY)
# ============================================================================
@orders_bp.route('/admin/all', methods=['GET'])
@jwt_required()
@admin_required
def get_all_orders():
    """
    Get all orders in the system (Admin only)

    Requires: Valid JWT token with admin privileges

    Returns:
        200: List of all orders
        403: Admin privileges required
        500: Server error
    """
    try:
        orders = OrderService.get_all_orders()

        return jsonify(format_response(True, {"orders": orders}, "Orders fetched successfully")), 200

    except Exception as e:
        logger.error(f"Error fetching all orders: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while fetching orders")), 500


# ============================================================================
# GET ORDER DETAILS (ADMIN)
# ============================================================================
@orders_bp.route('/admin/<int:order_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_order_details(order_id):
    """
    Get detailed order information (Admin only)

    Args:
        order_id: ID of the order

    Requires: Valid JWT token with admin privileges

    Returns:
        200: Order details
        403: Admin privileges required
        404: Order not found
        500: Server error
    """
    try:
        from app.models import Order

        order = Order.query.get(order_id)
        if not order:
            return jsonify(format_response(False, None, "Order not found")), 404

        order_data = OrderService.get_order_by_reference(order.order_reference)

        return jsonify(format_response(True, {"order": order_data}, "Order details fetched successfully")), 200

    except Exception as e:
        logger.error(f"Error fetching order details: {str(e)}")
        return jsonify(format_response(False, None, "An error occurred while fetching order details")), 500


# ============================================================================
# UPDATE ORDER STATUS (ADMIN ONLY)
# ============================================================================
@orders_bp.route('/status/<int:order_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_order_status(order_id):
    """
    Update order status (Admin only)

    Args:
        order_id: ID of the order

    Expected JSON:
    {
        "status": "Shipped"
    }

    Valid statuses:
    - Order Placed
    - Packing
    - Shipped
    - Out for Delivery
    - Delivered

    Requires: Valid JWT token with admin privileges

    Returns:
        200: Status updated successfully
        400: Invalid status
        403: Admin privileges required
        404: Order not found
        500: Server error
    """
    try:
        data = request.get_json()

        if not data or 'status' not in data:
            return jsonify(format_response(False, None, "Status is required")), 400

        new_status = data['status']

        # Update order status using service
        success, message = OrderService.update_order_status(
            order_id, new_status)

        if not success:
            status_code = 404 if "not found" in message.lower() else 400
            return jsonify(format_response(False, None, message)), status_code

        logger.info(f"Order {order_id} status updated to {new_status}")
        return jsonify(format_response(True, None, message)), 200

    except Exception as e:
        logger.error(f"Error updating order status: {str(e)}")
        return jsonify(format_response(False, None, "Failed to update order status")), 500


# ============================================================================
# GENERATE INVOICE/RECEIPT PDF
# ============================================================================
@orders_bp.route('/document/<string:order_reference>/<string:doc_type>', methods=['GET'])
@jwt_required()
def generate_document(order_reference, doc_type):
    """
    Generate invoice or receipt PDF

    Args:
        order_reference: Order reference number
        doc_type: 'invoice' or 'receipt'

    Requires: Valid JWT token

    Returns:
        200: PDF file
        400: Invalid document type
        403: Unauthorized access
        404: Order not found
        500: Server error
    """
    try:
        # Validate document type
        if doc_type not in ['invoice', 'receipt']:
            return jsonify(format_response(False, None, "Invalid document type. Must be 'invoice' or 'receipt'")), 400

        current_user_id = get_jwt_identity()

        # Get order and verify ownership
        order = Order.query.filter_by(order_reference=order_reference).first()

        if not order:
            return jsonify(format_response(False, None, "Order not found")), 404

        if str(order.user_id) != current_user_id:
            return jsonify(format_response(False, None, "Unauthorized access to this order")), 403

        # Check if trying to access receipt for non-delivered order
        if doc_type == 'receipt' and order.status != 'Delivered':
            return jsonify(format_response(False, None, "Receipt is only available for delivered orders")), 400

        # Generate PDF
        pdf_content = _generate_pdf(order, doc_type)

        if not pdf_content:
            return jsonify(format_response(False, None, "Failed to generate PDF")), 500

        # Send PDF file
        return send_file(
            BytesIO(pdf_content),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'{doc_type}_{order.order_reference}.pdf'
        )

    except Exception as e:
        logger.error(f"Error generating {doc_type}: {str(e)}")
        return jsonify(format_response(False, None, f"Failed to generate {doc_type}")), 500


def _generate_pdf(order, doc_type):
    """
    Generate PDF content for invoice or receipt

    Args:
        order: Order object
        doc_type: 'invoice' or 'receipt'

    Returns:
        bytes: PDF content or None if failed
    """
    try:
        from flask import render_template_string

        company_name = "Phone Home Kenya"

        # Choose template based on document type
        if doc_type == 'invoice':
            template = _get_invoice_template()
        else:
            template = _get_receipt_template()

        # Render HTML
        html = render_template_string(
            template,
            order=order,
            company_name=company_name,
            now=datetime.now()
        )

        # Convert to PDF
        pdf_buffer = BytesIO()
        pisa_status = pisa.CreatePDF(BytesIO(html.encode("utf-8")), pdf_buffer)

        if pisa_status.err:
            logger.error(f"PDF generation error: {pisa_status.err}")
            return None

        pdf_buffer.seek(0)
        return pdf_buffer.read()

    except Exception as e:
        logger.error(f"Error in _generate_pdf: {str(e)}")
        return None


def _get_invoice_template():
    """Get invoice HTML template"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Invoice - {{ order.order_reference }}</title>
        <style>
            body { font-family: Arial, sans-serif; color: #e4e4e4; background-color: #111; padding: 20px; }
            .document { max-width: 800px; margin: 0 auto; padding: 30px; background-color: #1a1a1a; border: 1px solid #333; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #e81cff; padding-bottom: 20px; }
            h1, h2, h3 { color: #e81cff; margin-top: 0; }
            .document-title { font-size: 24px; font-weight: bold; text-transform: uppercase; }
            .company-name { font-size: 24px; font-weight: bold; color: #e81cff; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-box { padding: 15px; background-color: #222; border-radius: 5px; }
            .info-box h3 { font-size: 16px; color: #e81cff; border-bottom: 1px solid #444; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background-color: #333; color: #e81cff; text-align: left; padding: 10px; }
            td { padding: 10px; border-bottom: 1px solid #444; }
            .totals { margin-top: 20px; text-align: right; }
            .total-row { font-weight: bold; font-size: 18px; color: #e81cff; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #444; padding-top: 20px; }
        </style>
    </head>
    <body>
        <div class="document">
            <div class="header">
                <div>
                    <h1 class="document-title">INVOICE</h1>
                    <p>Order #{{ order.order_reference }}</p>
                </div>
                <div class="company-name">{{ company_name }}</div>
            </div>
            
            <div class="info-grid">
                <div class="info-box">
                    <h3>ORDER INFORMATION</h3>
                    <p><strong>Date:</strong> {{ order.created_at.strftime('%B %d, %Y') }}</p>
                    <p><strong>Payment Method:</strong> {{ order.payment.payment_method if order.payment else "N/A" }}</p>
                    <p><strong>Order Status:</strong> {{ order.status }}</p>
                </div>
                
                <div class="info-box">
                    <h3>CUSTOMER DETAILS</h3>
                    <p><strong>Name:</strong> {{ order.address.first_name }} {{ order.address.last_name }}</p>
                    <p><strong>Phone:</strong> {{ order.address.phone }}</p>
                    <p><strong>Address:</strong> {{ order.address.street }}, {{ order.address.city }}</p>
                    {% if order.address.additional_info %}
                    <p><strong>Additional:</strong> {{ order.address.additional_info }}</p>
                    {% endif %}
                </div>
            </div>
            
            <h2>ORDER ITEMS</h2>
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Variation</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {% for item in order.order_items %}
                    <tr>
                        <td>{{ item.product.name }}</td>
                        <td>{{ item.variation_name if item.variation_name else "Standard" }}</td>
                        <td>{{ item.quantity }}</td>
                        <td>KES {{ "%.2f"|format(item.variation_price or item.product.price) }}</td>
                        <td>KES {{ "%.2f"|format((item.variation_price or item.product.price) * item.quantity) }}</td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
            
            <div class="totals">
                <p class="total-row">TOTAL: KES {{ "%.2f"|format(order.total_amount) }}</p>
            </div>
            
            <div class="footer">
                <p>Thank you for your order! This is not a receipt.</p>
                <p>© {{ now.year }} {{ company_name }}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """


def _get_receipt_template():
    """Get receipt HTML template"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Receipt - {{ order.order_reference }}</title>
        <style>
            body { font-family: Arial, sans-serif; color: #e4e4e4; background-color: #111; padding: 20px; }
            .document { max-width: 800px; margin: 0 auto; padding: 30px; background-color: #1a1a1a; border: 1px solid #333; position: relative; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #4caf50; padding-bottom: 20px; }
            h1, h2, h3 { color: #4caf50; margin-top: 0; }
            .document-title { font-size: 24px; font-weight: bold; text-transform: uppercase; }
            .company-name { font-size: 24px; font-weight: bold; color: #4caf50; }
            .paid-stamp { position: absolute; top: 100px; right: 100px; font-size: 40px; color: #4caf50; border: 5px solid #4caf50; padding: 10px 20px; transform: rotate(-15deg); opacity: 0.7; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-box { padding: 15px; background-color: #222; border-radius: 5px; }
            .info-box h3 { font-size: 16px; color: #4caf50; border-bottom: 1px solid #444; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background-color: #333; color: #4caf50; text-align: left; padding: 10px; }
            td { padding: 10px; border-bottom: 1px solid #444; }
            .totals { margin-top: 20px; text-align: right; }
            .total-row { font-weight: bold; font-size: 18px; color: #4caf50; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #444; padding-top: 20px; }
        </style>
    </head>
    <body>
        <div class="document">
            <div class="header">
                <div>
                    <h1 class="document-title">RECEIPT</h1>
                    <p>Order #{{ order.order_reference }}</p>
                </div>
                <div class="company-name">{{ company_name }}</div>
            </div>
            
            <div class="paid-stamp">PAID</div>
            
            <div class="info-grid">
                <div class="info-box">
                    <h3>PAYMENT INFORMATION</h3>
                    <p><strong>Date:</strong> {{ order.created_at.strftime('%B %d, %Y') }}</p>
                    <p><strong>Payment Method:</strong> {{ order.payment.payment_method if order.payment else "N/A" }}</p>
                    <p><strong>Payment Status:</strong> PAID</p>
                    {% if order.payment and order.payment.mpesa_receipt %}
                    <p><strong>M-Pesa Receipt:</strong> {{ order.payment.mpesa_receipt }}</p>
                    {% endif %}
                </div>
                
                <div class="info-box">
                    <h3>CUSTOMER DETAILS</h3>
                    <p><strong>Name:</strong> {{ order.address.first_name }} {{ order.address.last_name }}</p>
                    <p><strong>Phone:</strong> {{ order.address.phone }}</p>
                    <p><strong>Address:</strong> {{ order.address.street }}, {{ order.address.city }}</p>
                </div>
            </div>
            
            <h2>ITEMS PURCHASED</h2>
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Variation</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {% for item in order.order_items %}
                    <tr>
                        <td>{{ item.product.name }}</td>
                        <td>{{ item.variation_name if item.variation_name else "Standard" }}</td>
                        <td>{{ item.quantity }}</td>
                        <td>KES {{ "%.2f"|format(item.variation_price or item.product.price) }}</td>
                        <td>KES {{ "%.2f"|format((item.variation_price or item.product.price) * item.quantity) }}</td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
            
            <div class="totals">
                <p class="total-row">TOTAL PAID: KES {{ "%.2f"|format(order.total_amount) }}</p>
            </div>
            
            <div class="footer">
                <p>Thank you for your purchase!</p>
                <p>This receipt serves as proof of payment.</p>
                <p>© {{ now.year }} {{ company_name }}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
