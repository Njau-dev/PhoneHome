import os
from datetime import datetime
from sib_api_v3_sdk import ApiClient, Configuration, TransactionalEmailsApi
from sib_api_v3_sdk.models import SendSmtpEmail, SendSmtpEmailTo, SendSmtpEmailAttachment
from flask import url_for, render_template_string
from itsdangerous import URLSafeTimedSerializer
from io import BytesIO
from xhtml2pdf import pisa
from models import db, User, Order, OrderItem, Payment
from functools import wraps
from flask import request, jsonify
from datetime import timedelta
from werkzeug.security import generate_password_hash
import logging
import logging.handlers
import traceback

config = Configuration()
config.api_key['api-key'] = os.getenv("BREVO_API_KEY")

serializer = URLSafeTimedSerializer(os.getenv('SECRET_KEY'))

# Configure logger for email service with both file and console handlers
def setup_email_logger():
    logger = logging.getLogger('email_service')
    logger.setLevel(logging.DEBUG)  # Set to DEBUG to catch all levels
    
    # Console Handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)
    
    # Formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(formatter)
    
    # Add handlers
    logger.addHandler(console_handler)
    
    return logger

email_logger = setup_email_logger()


# Base email template with your color scheme
BASE_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background-color: #2a2a2a; 
            color: #ffffff; 
            padding: 20px;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #333333; 
            padding: 30px; 
            border-radius: 5px;
        }
        .header { 
            color: #d4af37; 
            text-align: center; 
            border-bottom: 1px solid #d4af37; 
            padding-bottom: 10px;
        }
        .content { 
            margin: 20px 0; 
            line-height: 1.6;
            color: #fff
        }
        .button { 
            background-color: #d4af37; 
            color: #2a2a2a !important; 
            padding: 10px 20px; 
            text-decoration: none; 
            border-radius: 5px; 
            font-weight: bold; 
            display: inline-block;
        }
        .footer { 
            text-align: center; 
            margin-top: 20px; 
            font-size: 12px; 
            color: #aaaaaa;
        }
        .order-item { 
            margin-bottom: 10px; 
            padding-bottom: 10px; 
            border-bottom: 1px solid #444;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ subject }}</h1>
        </div>
         <div class="content">
             {{ content|safe }}
         </div>

        <div class="footer">
            © {{ current_year }} Phone Home Kenya. All rights reserved.
        </div>
    </div>
 </body>
 </html>
"""

def send_email(to_email, subject, html_content, attachments=None):
    """Base email sending function with enhanced error handling"""
    try:
        # email_logger.info(f"Initializing email send to {to_email}")
        # email_logger.debug(f"API Key present: {'Yes' if os.getenv('BREVO_API_KEY') else 'No'}")
        
        if not os.getenv('BREVO_API_KEY'):
            email_logger.error("BREVO_API_KEY not found in environment variables")
            return False
            
        config = Configuration()
        config.api_key['api-key'] = os.getenv('BREVO_API_KEY')
        
        api_client = ApiClient(config)
        api_instance = TransactionalEmailsApi(api_client)
        email_logger.debug("API client initialized")
        
        sender = SendSmtpEmailTo(
            email=os.getenv("BREVO_SENDER_EMAIL", "no-reply@phonehome.com"),
            name=os.getenv("BREVO_SENDER_NAME", "Phone Home")
        )
        
        to = [SendSmtpEmailTo(email=to_email)]
        
        # Create email object without attachment parameter if no attachments
        if attachments:
            email = SendSmtpEmail(
                to=to,
                sender=sender,
                subject=subject,
                html_content=html_content,
                attachment=attachments
            )
        else:
            email = SendSmtpEmail(
                to=to,
                sender=sender,
                subject=subject,
                html_content=html_content
            )
        
        api_instance.send_transac_email(email)
        return True
        
    except Exception as e:
        error_details = traceback.format_exc()
        email_logger.error(f"Failed to send email to {to_email}")
        email_logger.error(f"Error details: {str(e)}")
        email_logger.error(f"Stack trace:\n{error_details}")
        return False
    

def generate_pdf(content, filename):
    """Generate PDF and return properly formatted base64 attachment"""
    try:
        # Create PDF in memory
        pdf_buffer = BytesIO()
        pisa_status = pisa.CreatePDF(
            content,
            dest=pdf_buffer
        )
        
        if pisa_status.err:
            return None
            
        # Get PDF content and encode properly for Brevo
        pdf_buffer.seek(0)
        pdf_content = pdf_buffer.getvalue()
        
        import base64
        pdf_base64 = base64.b64encode(pdf_content).decode('utf-8')
        
        # Create attachment object with proper format
        attachment = SendSmtpEmailAttachment(
            name=f"{filename}.pdf",
            content=pdf_base64,  # Use base64 encoded content
        )
        
        return attachment
        
    except Exception as e:
        email_logger.error(f"Stack trace: {traceback.format_exc()}")
        return None
    

# Email Templates
def render_email_template(template, **context):
    """Render email template with base styling"""
    try:
        return render_template_string(
            source=template,
            **context
        )
    except Exception as e:
        email_logger.error(f"Template rendering failed: {str(e)}")
        raise

def send_password_reset_email(user_email, reset_url):
    """Password reset email with enhanced error handling"""
    try:        
        subject = "Password Reset Request"
        content = f"""
        <p>You requested a password reset. Click the button below to proceed:</p>
        <p><a href="{reset_url}" class="button">Reset Password</a></p>
        <p>This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
        """
                
        # Render template with current year context instead of 'now' tag
        try:
            html = render_email_template(
                template=BASE_TEMPLATE,
                subject=subject,
                content=content,
                current_year=datetime.utcnow().year
            )
        except Exception as e:
            email_logger.error(f"Template rendering failed: {str(e)}")
            email_logger.error(f"Stack trace: {traceback.format_exc()}")
            return False
        
        # Send email
        success = send_email(
            to_email=user_email,
            subject=subject,
            html_content=html
        )
        
        if success:
            email_logger.info(f"Password reset email sent successfully to {user_email}")
        else:
            email_logger.error(f"Failed to send password reset email to {user_email}")
        
        return success
        
    except Exception as e:
        error_details = traceback.format_exc()
        email_logger.error(f"Error in send_password_reset_email for {user_email}")
        email_logger.error(f"Error details: {str(e)}")
        email_logger.error(f"Stack trace:\n{error_details}")
        return False
    

def send_order_confirmation(order):
    try:        
        user = order.user
        subject = f"Order Confirmation #{order.order_reference}"
        
        # Build items HTML with error handling
        items_html = ""
        for item in order.order_items:
            try:
                price = float(item.variation_price if item.variation_price is not None 
                            else item.product.price)
                items_html += f"""
                <div class="order-item">
                    <p><strong>{item.product.name}</strong> (Qty: {item.quantity})</p>
                    <p>Price: Kshs{price:.2f}</p>
                </div>
                """
            except Exception as e:
                email_logger.error(f"Error formatting order item: {str(e)}")
                continue

        # Access address fields directly
        address = order.address
        address_html = f"""
        <p>{address.street}<br>
        {address.city}</p>
        """

        content = f"""
        <p>Thank you for your order! Here are your order details:</p>
        <p><strong>Order Reference:</strong> #{order.order_reference}</p>
        <p><strong>Order Date:</strong> {order.created_at.strftime('%B %d, %Y %H:%M')}</p>
        <p><strong>Total Amount:</strong> Kshs{float(order.total_amount):.2f}</p>
        
        <h3>Order Items:</h3>
        {items_html}
        
        <h3>Shipping Address:</h3>
        <p><strong>Name:</strong> {address.first_name} {address.last_name}</p>
        <p><strong>Email:</strong> {address.email}</p>
        <p><strong>Phone:</strong> {address.phone}</p>
        <p><strong>Address:</strong><br>{address_html}</p>
        """
        
        html = render_email_template(
            BASE_TEMPLATE, 
            subject=subject, 
            content=content,
            current_year=datetime.utcnow().year
        )
        
        # Generate PDF invoice with error handling
        try:
            invoice_content = render_template_string("""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial; }
                    .header { text-align: center; }
                    .details { margin: 20px 0; }
                    .item { margin: 10px 0; }
                    .total { font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Invoice for Order #{{ order.order_reference }}</h1>
                    <p>Date: {{ order.created_at.strftime('%B %d, %Y') }}</p>
                </div>
                
                <div class="details">
                    <h2>Customer Details:</h2>
                    <p>Name: {{ order.address.first_name }} {{ order.address.last_name }}</p>
                    <p>Email: {{ order.address.email }}</p>
                    <p>Phone: {{ order.address.phone }}</p>
                    <p>Address: {{ order.address.street }}, {{ order.address.city }}</p>
                </div>
                
                <div class="items">
                    <h2>Order Items:</h2>
                    {% for item in order.order_items %}
                    <div class="item">
                        <p>{{ item.product.name }} x {{ item.quantity }}</p>
                        <p>Price: Kshs{{ "%.2f"|format(item.variation_price or item.product.price) }}</p>
                    </div>
                    {% endfor %}
                </div>
                
                <div class="total">
                    <p>Total Amount: Kshs{{ "%.2f"|format(order.total_amount) }}</p>
                </div>
            </body>
            </html>
            """, order=order)
            
            pdf_attachment = generate_pdf(invoice_content, f"invoice_{order.order_reference}")
            attachments = [pdf_attachment]
        except Exception as e:
            email_logger.error(f"Error generating PDF: {str(e)}")
            attachments = None
        
        if pdf_attachment:
            attachments = [pdf_attachment]
            # Send email
            sent = send_email(
                to_email=address.email,
                subject=subject,
                html_content=html,
                attachments=attachments
            )
        else:
            # Send email
            sent = send_email(
                to_email=address.email,
                subject=subject,
                html_content=html,
            )
        
        if sent:
            return True
        else:
            return False
            
    except Exception as e:
        email_logger.error(f"Error sending order confirmation: {str(e)}\n{traceback.format_exc()}")
        return False
    

def send_payment_notification(payment):
    """Send payment notification email with invoice"""
    try:
        order = payment.order[0] if isinstance(payment.order, list) or hasattr(payment.order, '__iter__') else payment.order
        user = order.user
        subject = f"Payment {payment.status} - Order #{order.order_reference}"
        
        status_style = "color: #4CAF50;" if payment.status == "Success" else "color: #F44336;"
        
        content = f"""
        <p>Your payment for Order #{order.order_reference} has been processed.</p>
        <p><strong>Status:</strong> <span style="{status_style}">{payment.status}</span></p>
        <p><strong>Amount:</strong> Kshs{payment.amount}</p>
        <p><strong>Method:</strong> {payment.payment_method}</p>
        <p><strong>Date:</strong> {payment.created_at.strftime('%B %d, %Y %H:%M')}</p>
        """
        
        # Generate invoice PDF
        invoice_content = render_template_string("""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial; }
                    .header { text-align: center; }
                    .details { margin: 20px 0; }
                    .item { margin: 10px 0; }
                    .total { font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Payment Receipt - Order #{{ order.order_reference }}</h1>
                    <p>Date: {{ payment.created_at.strftime('%B %d, %Y %H:%M') }}</p>
                </div>
                
                <div class="details">
                    <h2>Payment Details:</h2>
                    <p>Status: {{ payment.status }}</p>
                    <p>Method: {{ payment.payment_method }}</p>
                    <p>Amount: Kshs{{ payment.amount }}</p>
                    <p>Transaction ID: {{ payment.transaction_id or payment.order_reference or 'N/A' }}</p>
                </div>
                
                <div class="details">
                    <h2>Customer Details:</h2>
                    <p>Name: {{ order.address.first_name }} {{ order.address.last_name }}</p>
                    <p>Email: {{ order.address.email }}</p>
                    <p>Phone: {{ order.address.phone }}</p>
                </div>
                
                <div class="items">
                    <h2>Order Items:</h2>
                    {% for item in order.order_items %}
                    <div class="item">
                        <p>{{ item.product.name }} x {{ item.quantity }}</p>
                        <p>Price: Kshs{{ item.variation_price or item.product.price }}</p>
                    </div>
                    {% endfor %}
                </div>
                
                <div class="total">
                    <p>Total Amount: Kshs{{ order.total_amount }}</p>
                </div>
            </body>
            </html>
        """, order=order, payment=payment)
        
        pdf_attachment = generate_pdf(invoice_content, f"receipt_{order.order_reference}")
        
        html = render_email_template(BASE_TEMPLATE, subject=subject, content=content)
        attachments = [pdf_attachment] if pdf_attachment else None
        
        return send_email(user.email, subject, html, attachments)
        
    except Exception as e:
        email_logger.error(f"Error sending payment notification: {str(e)}")
        return False

def send_shipment_update(order, old_status, new_status):
    subject = f"Shipment Update for Order #{order.order_reference}"
    content = f"""
    <p>Your order's shipment status has been updated:</p>
    <p><strong>From:</strong> {old_status}</p>
    <p><strong>To:</strong> {new_status}</p>
    <p>Expected delivery date: {datetime.now().strftime('%B %d, %Y')}</p>
    """
    html = render_email_template(BASE_TEMPLATE, subject=subject, content=content)
    return send_email(order.user.email, subject, html)

def send_review_request(order_item):
    subject = f"How was your {order_item.product.name}?"
    content = f"""
    <p>We'd love to hear your feedback about your recent purchase!</p>
    <p>Please take a moment to review your {order_item.product.name}:</p>
    <p><a href="{url_for('product', id=order_item.product_id, _external=True)}" class="button">Leave a Review</a></p>
    """
    html = render_email_template(BASE_TEMPLATE, subject=subject, content=content)
    return send_email(order_item.order.user.email, subject, html)

def send_receipt_pdf(payment: Payment):
    try:
        order = payment.order
        user = order.user
        subject = f"Payment Receipt - Order #{order.order_reference}"

        content = f"""
        <p>Thank you for your payment for Order #{order.order_reference}.</p>
        <p>Payment Status: {payment.status}</p>
        <p>Amount Paid: Kshs{payment.amount}</p>
        <p>Payment Method: {payment.payment_method}</p>
        <p>Date: {payment.created_at.strftime('%B %d, %Y %H:%M')}</p>
        """

        # Render the receipt HTML content for PDF
        receipt_html = render_template_string("""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial; }
                    .header { text-align: center; }
                    .details { margin: 20px 0; }
                    .item { margin: 10px 0; }
                    .total { font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Payment Receipt - Order #{{ order.order_reference }}</h1>
                    <p>Date: {{ payment.created_at.strftime('%B %d, %Y %H:%M') }}</p>
                </div>
                <div class="details">
                    <h2>Payment Details:</h2>
                    <p>Status: {{ payment.status }}</p>
                    <p>Method: {{ payment.payment_method }}</p>
                    <p>Amount: Kshs{{ payment.amount }}</p>
                    <p>Transaction ID: {{ payment.transaction_id or payment.order_reference or 'N/A' }}</p>
                </div>
                <div class="details">
                    <h2>Customer Details:</h2>
                    <p>Name: {{ order.address.first_name }} {{ order.address.last_name }}</p>
                    <p>Email: {{ order.address.email }}</p>
                    <p>Phone: {{ order.address.phone }}</p>
                </div>
                <div class="items">
                    <h2>Order Items:</h2>
                    {% for item in order.order_items %}
                    <div class="item">
                        <p>{{ item.product.name }} x {{ item.quantity }}</p>
                        <p>Price: Kshs{{ item.variation_price or item.product.price }}</p>
                    </div>
                    {% endfor %}
                </div>
                <div class="total">
                    <p>Total Amount: Kshs{{ order.total_amount }}</p>
                </div>
            </body>
            </html>
        """, order=order, payment=payment)

        # Generate PDF attachment
        pdf_attachment = generate_pdf(receipt_html, f"receipt_{order.order_reference}")

        # Render email HTML with base template
        html = render_email_template(
            template=BASE_TEMPLATE,
            subject=subject,
            content=content,
            current_year=payment.created_at.year
        )

        attachments = [pdf_attachment] if pdf_attachment else None

        # Send email with attachment
        return send_email(user.email, subject, html, attachments)

    except Exception as e:
        # Log error as needed
        return False