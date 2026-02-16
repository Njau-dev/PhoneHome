"""
M-Pesa Payment Service
Handles M-Pesa STK push payments and callbacks
"""
import base64
import logging
from datetime import datetime

import requests

logger = logging.getLogger(__name__)


class MpesaService:
    """Service for handling M-Pesa payments"""

    def __init__(self, config=None):
        """
        Initialize M-Pesa service with configuration

        Args:
            config: Dictionary with M-Pesa configuration
                   Can be Flask app config or dict
        """
        if config is None:
            from flask import current_app
            config = current_app.config

        self.config = config
        self._load_config()

    def _load_config(self):
        """Load and validate M-Pesa configuration"""
        self.consumer_key = self.config.get('MPESA_CONSUMER_KEY')
        self.consumer_secret = self.config.get('MPESA_CONSUMER_SECRET')
        self.till_number = self.config.get('MPESA_BUSINESS_SHORTCODE')
        self.passkey = self.config.get('MPESA_PASSKEY')
        self.environment = self.config.get(
            'MPESA_ENVIRONMENT', 'sandbox').lower()
        self.callback_base_url = self.config.get(
            'BACKEND_URL', 'http://localhost:5000')

        # Validate required config
        self._validate_config()

        # Set base URLs
        if self.environment == 'production':
            self.base_url = "https://api.safaricom.co.ke"
        else:
            self.base_url = "https://sandbox.safaricom.co.ke"

        self.auth_url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        self.stk_push_url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"

    def _validate_config(self):
        """Validate that all required configuration is set"""
        required_configs = [
            ('MPESA_CONSUMER_KEY', self.consumer_key),
            ('MPESA_CONSUMER_SECRET', self.consumer_secret),
            ('MPESA_BUSINESS_SHORTCODE', self.till_number),
            ('MPESA_PASSKEY', self.passkey),
        ]

        missing = [name for name, value in required_configs if not value]

        if missing:
            raise ValueError(
                f"Missing M-Pesa configuration: {', '.join(missing)}")

    @staticmethod
    def init_app(app):
        """
        Initialize M-Pesa service with Flask app

        Args:
            app: Flask application instance

        Returns:
            MpesaService instance
        """
        return MpesaService(app.config)

    def get_access_token(self):
        """
        Get OAuth access token from Safaricom

        Returns:
            tuple: (access_token, error_message)
        """
        try:
            credentials = f"{self.consumer_key}:{self.consumer_secret}"
            encoded_credentials = base64.b64encode(
                credentials.encode()).decode()

            headers = {"Authorization": f"Basic {encoded_credentials}"}

            response = requests.get(self.auth_url, headers=headers, timeout=30)
            response.raise_for_status()

            token_data = response.json()
            access_token = token_data.get("access_token")

            if not access_token:
                return None, "Failed to retrieve access token"

            return access_token, None

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get M-Pesa access token: {e}")
            return None, f"Failed to get access token: {str(e)}"
        except Exception as e:
            logger.error(f"Unexpected error getting access token: {e}")
            return None, f"Unexpected error: {str(e)}"

    def generate_password(self):
        """
        Generate base64 encoded password for STK push

        Returns:
            tuple: (password, timestamp)
        """
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        password_string = f"{self.till_number}{self.passkey}{timestamp}"
        password = base64.b64encode(password_string.encode()).decode()
        return password, timestamp

    def format_phone_number(self, phone_number):
        """
        Format phone number to Safaricom format (254XXXXXXXXX)

        Args:
            phone_number: Phone number in various formats

        Returns:
            Formatted phone number
        """
        # Remove any whitespace
        phone = phone_number.strip()

        # Remove leading 0 or +254
        if phone.startswith("0"):
            phone = "254" + phone[1:]
        elif phone.startswith("+254"):
            phone = phone[1:]
        elif phone.startswith("254"):
            pass  # Already correct
        else:
            # Assume it's 254 without +, add it
            if not phone.startswith("254"):
                phone = "254" + phone

        return phone

    def initiate_payment(self, phone_number, amount, order_reference, callback_path="/api/payments/ganji/inaflow"):
        """
        Initiate STK Push payment

        Args:
            phone_number: Customer phone number
            amount: Payment amount
            order_reference: Unique order reference
            callback_path: Callback URL path

        Returns:
            dict: {
                "success": bool,
                "data": dict if success,
                "error": str if failure
            }
        """
        try:
            # Get access token
            access_token, error = self.get_access_token()
            if error:
                return {
                    "success": False,
                    "error": error
                }

            # Generate password and timestamp
            password, timestamp = self.generate_password()

            # Format phone number
            formatted_phone = self.format_phone_number(phone_number)

            # Prepare callback URL
            callback_url = f"{self.callback_base_url}{callback_path}"

            # Prepare payload
            payload = {
                "BusinessShortCode": self.till_number,
                "Password": password,
                "Timestamp": timestamp,
                "TransactionType": "CustomerBuyGoodsOnline",
                "Amount": int(amount),
                "PartyA": formatted_phone,
                "PartyB": self.till_number,
                "PhoneNumber": formatted_phone,
                "CallBackURL": callback_url,
                "AccountReference": order_reference,
                "TransactionDesc": f"Payment for order {order_reference}"
            }

            # Send request
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }

            logger.info(
                f"Initiating payment for order {order_reference}, amount: {amount}")

            response = requests.post(
                self.stk_push_url,
                json=payload,
                headers=headers,
                timeout=30
            )
            response.raise_for_status()

            result = response.json()

            # Check response code
            if result.get("ResponseCode") == "0":
                return {
                    "success": True,
                    "data": {
                        "checkout_request_id": result.get("CheckoutRequestID"),
                        "merchant_request_id": result.get("MerchantRequestID"),
                        "response_description": result.get("ResponseDescription"),
                        "customer_message": result.get("CustomerMessage", "")
                    }
                }
            else:
                error_msg = result.get("errorMessage", "STK Push failed")
                return {
                    "success": False,
                    "error": f"M-Pesa error: {error_msg}"
                }

        except requests.exceptions.RequestException as e:
            logger.error(f"Payment request failed: {e}")
            return {
                "success": False,
                "error": f"Payment request failed: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Unexpected error during payment: {e}")
            return {
                "success": False,
                "error": f"Payment initiation failed: {str(e)}"
            }

    def process_callback(self, callback_data):
        """
        Process M-Pesa callback data

        Args:
            callback_data: Dictionary with callback data from Safaricom

        Returns:
            dict: {
                "success": bool,
                "data": dict if success,
                "error": str if failure
            }
        """
        try:
            # Extract relevant data from callback
            result_code = callback_data.get("Body", {}).get(
                "stkCallback", {}).get("ResultCode")
            result_desc = callback_data.get("Body", {}).get(
                "stkCallback", {}).get("ResultDesc")
            checkout_request_id = callback_data.get("Body", {}).get(
                "stkCallback", {}).get("CheckoutRequestID")

            # Find metadata
            metadata = {}
            callback_metadata = callback_data.get("Body", {}).get(
                "stkCallback", {}).get("CallbackMetadata", {})
            if callback_metadata and "Item" in callback_metadata:
                for item in callback_metadata["Item"]:
                    if "Name" in item and "Value" in item:
                        metadata[item["Name"]] = item["Value"]

            # Determine if successful
            success = result_code == 0

            # Prepare result
            result = {
                "success": success,
                "result_code": result_code,
                "result_desc": result_desc,
                "checkout_request_id": checkout_request_id,
                "metadata": metadata
            }

            if success:
                return {
                    "success": True,
                    "data": result
                }
            else:
                return {
                    "success": False,
                    "error": f"Payment failed: {result_desc}",
                    "data": result
                }

        except Exception as e:
            logger.error(f"Error processing callback: {e}")
            return {
                "success": False,
                "error": f"Failed to process callback: {str(e)}"
            }

    def validate_payment_data(self, phone_number, amount):
        """
        Validate payment data before initiating payment

        Args:
            phone_number: Phone number to validate
            amount: Amount to validate

        Returns:
            tuple: (is_valid: bool, error_message: str)
        """
        if not phone_number or not phone_number.strip():
            return False, "Phone number is required"

        if not amount or amount <= 0:
            return False, "Amount must be greater than 0"

        try:
            # Validate phone number format
            phone = phone_number.strip()
            if len(phone) < 10:
                return False, "Invalid phone number"

            return True, None
        except Exception as e:
            return False, f"Validation error: {str(e)}"
