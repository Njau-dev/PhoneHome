"""
Email Service
Handles sending various types of emails (order confirmations, password resets, etc.)
"""
import base64
import logging
from datetime import UTC, datetime, timedelta
from io import BytesIO

from flask import current_app, render_template_string
from itsdangerous import URLSafeTimedSerializer
from sib_api_v3_sdk import ApiClient, Configuration, TransactionalEmailsApi
from sib_api_v3_sdk.models import SendSmtpEmail, SendSmtpEmailAttachment, SendSmtpEmailTo
from xhtml2pdf import pisa

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via Brevo (Sendinblue)"""

    # Base email template
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

    def __init__(self, config=None):
        """
        Initialize email service with configuration

        Args:
            config: Dictionary with email configuration
                   Can be Flask app config or dict
        """
        if config is None:
            config = current_app.config

        self.config = config
        self._load_config()

    def _load_config(self):
        """Load and validate email configuration"""
        self.brevo_api_key = self.config.get('BREVO_API_KEY')
        self.brevo_sender_email = self.config.get(
            'BREVO_SENDER_EMAIL', 'no-reply@phonehome.co.ke')
        self.brevo_sender_name = self.config.get(
            'BREVO_SENDER_NAME', 'Phone Home')
        self.secret_key = self.config.get('SECRET_KEY')
        self.backend_url = self.config.get(
            'BACKEND_URL', 'http://localhost:5000')

        # Validate required config
        self._validate_config()

        # Initialize serializer for tokens
        if self.secret_key:
            self.serializer = URLSafeTimedSerializer(self.secret_key)

    def _validate_config(self):
        """Validate that all required configuration is set"""
        if not self.brevo_api_key:
            raise ValueError("BREVO_API_KEY is required for email service")

        if not self.secret_key:
            raise ValueError("SECRET_KEY is required for email service")

    @staticmethod
    def init_app(app):
        """
        Initialize email service with Flask app

        Args:
            app: Flask application instance

        Returns:
            EmailService instance
        """
        return EmailService(app.config)

    def _send_email(self, to_email, subject, html_content, attachments=None):
        """
        Base email sending function

        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML email content
            attachments: List of email attachments

        Returns:
            dict: {
                "success": bool,
                "error": str if failure
            }
        """
        try:
            if not self.brevo_api_key:
                logger.error("BREVO_API_KEY not configured")
                return {
                    "success": False,
                    "error": "Email service not configured"
                }

            # Configure Brevo API
            brevo_config = Configuration()
            brevo_config.api_key['api-key'] = self.brevo_api_key

            api_client = ApiClient(brevo_config)
            api_instance = TransactionalEmailsApi(api_client)

            # Setup sender and recipient
            sender = SendSmtpEmailTo(
                email=self.brevo_sender_email,
                name=self.brevo_sender_name
            )
            recipient = [SendSmtpEmailTo(email=to_email)]

            # Create email object
            email_params = {
                "to": recipient,
                "sender": sender,
                "subject": subject,
                "html_content": html_content
            }

            if attachments:
                email_params["attachment"] = attachments

            email = SendSmtpEmail(**email_params)

            # Send email
            api_instance.send_transac_email(email)

            logger.info(f"Email sent successfully to {to_email}")
            return {"success": True}

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to send email: {str(e)}"
            }

    def _generate_pdf(self, content, filename):
        """
        Generate PDF from HTML content

        Args:
            content: HTML content
            filename: Base filename for PDF

        Returns:
            SendSmtpEmailAttachment or None
        """
        try:
            # Create PDF in memory
            pdf_buffer = BytesIO()
            pisa_status = pisa.CreatePDF(content, dest=pdf_buffer)

            if pisa_status.err:
                logger.error("Failed to generate PDF")
                return None

            # Get PDF content and encode
            pdf_buffer.seek(0)
            pdf_content = pdf_buffer.getvalue()
            pdf_base64 = base64.b64encode(pdf_content).decode('utf-8')

            # Create attachment object
            attachment = SendSmtpEmailAttachment(
                name=f"{filename}.pdf",
                content=pdf_base64,
            )

            return attachment

        except Exception as e:
            logger.error(f"Error generating PDF {filename}: {str(e)}")
            return None

    def _render_template(self, template, **context):
        """
        Render email template

        Args:
            template: Template string
            **context: Template context variables

        Returns:
            Rendered template string
        """
        try:
            # Ensure current_year is in context
            if 'current_year' not in context:
                context['current_year'] = datetime.now(UTC).year

            return render_template_string(source=template, **context)
        except Exception as e:
            logger.error(f"Template rendering failed: {str(e)}")
            raise

    def send_password_reset(self, user_email, reset_url):
        """
        Send password reset email

        Args:
            user_email: User's email address
            reset_url: Password reset URL

        Returns:
            dict: {
                "success": bool,
                "error": str if failure
            }
        """
        try:
            subject = "Password Reset Request"

            content = f"""
            <p>You requested a password reset. Click the button below to proceed:</p>
            <p><a href="{reset_url}" class="button">Reset Password</a></p>
            <p>This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
            """

            # Render email template
            html = self._render_template(
                template=self.BASE_TEMPLATE,
                subject=subject,
                content=content
            )

            # Send email
            result = self._send_email(
                to_email=user_email,
                subject=subject,
                html_content=html
            )

            if result["success"]:
                logger.info(f"Password reset email sent to {user_email}")

            return result

        except Exception as e:
            logger.error(
                f"Error sending password reset to {user_email}: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to send password reset email: {str(e)}"
            }

    def send_order_confirmation(self, order):
        """
        Send order confirmation email with invoice

        Args:
            order: Order object

        Returns:
            dict: {
                "success": bool,
                "error": str if failure
            }
        """
        try:
            # Get recipient email from order address
            if not order.address or not order.address.email:
                return {
                    "success": False,
                    "error": "Order has no email address"
                }

            recipient_email = order.address.email
            subject = f"Order Confirmation #{order.order_reference}"

            # Build order items HTML
            items_html = ""
            for item in order.order_items:
                try:
                    price = float(item.variation_price if item.variation_price is not None
                                  else item.product.price)
                    items_html += f"""
                    <div class="order-item">
                        <p><strong>{item.product.name}</strong> (Qty: {item.quantity})</p>
                        <p>Price: Kshs {price:.2f}</p>
                    </div>
                    """
                except Exception as e:
                    logger.error(f"Error formatting order item: {str(e)}")
                    continue

            # Build address HTML
            address = order.address
            address_html = f"""
            <p>{address.first_name} {address.last_name}<br>
            {address.street}<br>
            {address.city}<br>
            Email: {address.email}<br>
            Phone: {address.phone}</p>
            """

            # Build email content
            content = f"""
            <p>Thank you for your order! Here are your order details:</p>
            <p><strong>Order Reference:</strong> #{order.order_reference}</p>
            <p><strong>Order Date:</strong> {order.created_at.strftime('%B %d, %Y %H:%M')}</p>
            <p><strong>Total Amount:</strong> Kshs {float(order.total_amount):.2f}</p>

            <h3>Order Items:</h3>
            {items_html}

            <h3>Shipping Address:</h3>
            {address_html}

            <p>We'll notify you once your order is shipped.</p>
            """

            # Render email template
            html = self._render_template(
                template=self.BASE_TEMPLATE,
                subject=subject,
                content=content
            )

            # Generate PDF invoice
            invoice_content = self._render_template("""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial; }
                    .header { text-align: center; }
                    .details { margin: 20px 0; }
                    .item { margin: 10px 0; }
                    .total { font-weight: bold; font-size: 18px; }
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
                        <p><strong>{{ item.product.name }}</strong> x {{ item.quantity }}</p>
                        <p>Price: Kshs {{ "%.2f"|format(item.variation_price or item.product.price) }}</p>
                    </div>
                    {% endfor %}
                </div>

                <div class="total">
                    <p>Total Amount: Kshs {{ "%.2f"|format(order.total_amount) }}</p>
                </div>
            </body>
            </html>
            """, order=order)

            pdf_attachment = self._generate_pdf(
                invoice_content, f"invoice_{order.order_reference}")

            attachments = [pdf_attachment] if pdf_attachment else None

            # Send email
            result = self._send_email(
                to_email=recipient_email,
                subject=subject,
                html_content=html,
                attachments=attachments
            )

            if result["success"]:
                logger.info(
                    f"Order confirmation sent for order #{order.order_reference}")

            return result

        except Exception as e:
            logger.error(f"Error sending order confirmation: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to send order confirmation: {str(e)}"
            }

    def send_payment_notification(self, payment):
        """
        Send payment notification email

        Args:
            payment: Payment object

        Returns:
            dict: {
                "success": bool,
                "error": str if failure
            }
        """
        try:
            order = payment.order
            if not order.address or not order.address.email:
                return {
                    "success": False,
                    "error": "Order has no email address"
                }

            recipient_email = order.address.email
            subject = f"Payment {payment.status} - Order #{order.order_reference}"

            # Determine status color
            status_color = "#4CAF50" if payment.status == "Success" else "#F44336"

            # Build email content
            content = f"""
            <p>Your payment for Order #{order.order_reference} has been processed.</p>
            <p><strong>Status:</strong> <span style="color: {status_color}; font-weight: bold;">{payment.status}</span></p>
            <p><strong>Amount:</strong> Kshs {payment.amount:.2f}</p>
            <p><strong>Method:</strong> {payment.payment_method}</p>
            <p><strong>Date:</strong> {payment.created_at.strftime('%B %d, %Y %H:%M')}</p>
            """

            if payment.transaction_id:
                content += f'<p><strong>Transaction ID:</strong> {payment.transaction_id}</p>'

            if payment.mpesa_receipt:
                content += f'<p><strong>M-Pesa Receipt:</strong> {payment.mpesa_receipt}</p>'

            # Render email template
            html = self._render_template(
                template=self.BASE_TEMPLATE,
                subject=subject,
                content=content
            )

            # Generate receipt PDF
            receipt_content = self._render_template("""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial; }
                    .header { text-align: center; }
                    .details { margin: 20px 0; }
                    .total { font-weight: bold; font-size: 18px; }
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
                    <p>Amount: Kshs {{ payment.amount }}</p>
                    <p>Transaction ID: {{ payment.transaction_id or 'N/A' }}</p>
                    {% if payment.mpesa_receipt %}
                    <p>M-Pesa Receipt: {{ payment.mpesa_receipt }}</p>
                    {% endif %}
                </div>

                <div class="details">
                    <h2>Customer Details:</h2>
                    <p>Name: {{ order.address.first_name }} {{ order.address.last_name }}</p>
                    <p>Email: {{ order.address.email }}</p>
                    <p>Phone: {{ order.address.phone }}</p>
                </div>
            </body>
            </html>
            """, order=order, payment=payment)

            pdf_attachment = self._generate_pdf(
                receipt_content, f"receipt_{order.order_reference}")

            attachments = [pdf_attachment] if pdf_attachment else None

            # Send email
            result = self._send_email(
                to_email=recipient_email,
                subject=subject,
                html_content=html,
                attachments=attachments
            )

            if result["success"]:
                logger.info(
                    f"Payment notification sent for order #{order.order_reference}")

            return result

        except Exception as e:
            logger.error(f"Error sending payment notification: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to send payment notification: {str(e)}"
            }

    def send_shipment_update(self, order, old_status, new_status):
        """
        Send shipment status update email

        Args:
            order: Order object
            old_status: Previous status
            new_status: New status

        Returns:
            dict: {
                "success": bool,
                "error": str if failure
            }
        """
        try:
            if not order.address or not order.address.email:
                return {
                    "success": False,
                    "error": "Order has no email address"
                }

            recipient_email = order.address.email
            subject = f"Shipment Update for Order #{order.order_reference}"

            # Build email content
            content = f"""
            <p>Your order's shipment status has been updated:</p>
            <p><strong>Previous Status:</strong> {old_status}</p>
            <p><strong>Current Status:</strong> <span style="color: #4CAF50; font-weight: bold;">{new_status}</span></p>
            <p><strong>Order Reference:</strong> #{order.order_reference}</p>
            """

            # Add estimated delivery for shipped orders
            if new_status.lower() in ["shipped", "out for delivery"]:
                delivery_date = (datetime.now() +
                                 timedelta(days=3)).strftime('%B %d, %Y')
                content += f'<p><strong>Estimated Delivery:</strong> {delivery_date}</p>'

            if new_status.lower() == "delivered":
                content += '<p>Your order has been delivered successfully. Thank you for shopping with us!</p>'

            # Render email template
            html = self._render_template(
                template=self.BASE_TEMPLATE,
                subject=subject,
                content=content
            )

            # Send email
            result = self._send_email(
                to_email=recipient_email,
                subject=subject,
                html_content=html
            )

            if result["success"]:
                logger.info(
                    f"Shipment update sent for order #{order.order_reference}")

            return result

        except Exception as e:
            logger.error(f"Error sending shipment update: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to send shipment update: {str(e)}"
            }

    def send_review_request(self, order_item):
        """
        Send product review request email

        Args:
            order_item: OrderItem object

        Returns:
            dict: {
                "success": bool,
                "error": str if failure
            }
        """
        try:
            order = order_item.order
            if not order.address or not order.address.email:
                return {
                    "success": False,
                    "error": "Order has no email address"
                }

            recipient_email = order.address.email
            product_name = order_item.product.name
            subject = f"How was your {product_name}?"

            # Build email content
            content = f"""
            <p>We hope you're enjoying your {product_name}!</p>
            <p>We'd love to hear your feedback to help us improve our products and services.</p>
            <p>Please take a moment to share your experience:</p>
            <p><a href="{self.backend_url}/products/{order_item.product_id}/review" class="button">
                Leave a Review
            </a></p>
            <p>Your feedback is valuable to us and helps other customers make informed decisions.</p>
            """

            # Render email template
            html = self._render_template(
                template=self.BASE_TEMPLATE,
                subject=subject,
                content=content
            )

            # Send email
            result = self._send_email(
                to_email=recipient_email,
                subject=subject,
                html_content=html
            )

            if result["success"]:
                logger.info(f"Review request sent for product {product_name}")

            return result

        except Exception as e:
            logger.error(f"Error sending review request: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to send review request: {str(e)}"
            }
