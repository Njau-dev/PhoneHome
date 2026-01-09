import requests
import base64
from datetime import datetime
import logging
import os
from dotenv import load_dotenv

load_dotenv()

# Set up a logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MpesaService:
    def __init__(self):
        """
        Initializes the MpesaService by loading all necessary configurations
        from environment variables and setting up API endpoints.
        """
        # Load credentials from environment variables
        self.consumer_key = os.getenv('MPESA_CONSUMER_KEY')
        self.consumer_secret = os.getenv('MPESA_CONSUMER_SECRET')

        # This is the specific Till Number customers pay to (e.g., 5431460)
        self.till_number = os.getenv('MPESA_BUSINESS_SHORTCODE')

        self.passkey = os.getenv('MPESA_PASSKEY')

        # Environment configuration (defaults to 'sandbox' if not set)
        self.environment = os.getenv('MPESA_ENVIRONMENT', 'sandbox').lower()

        # Base URL configuration based on environment
        if self.environment == 'production':
            self.base_url = "https://api.safaricom.co.ke"
        else:
            self.base_url = "https://sandbox.safaricom.co.ke"

        # API endpoints
        self.auth_url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        self.stk_push_url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"

        # Callback URL configuration
        self.backend_url = os.getenv(
            'BACKEND_URL', 'https://api.phonehome.co.ke')
        self.callback_url = f"{self.backend_url}/ganji/inaflow"

        # Validate required environment variables
        self._validate_config()

    def _validate_config(self):
        """Validate that all required environment variables for STK Push are set."""
        required_vars = [
            ('MPESA_CONSUMER_KEY', self.consumer_key),
            ('MPESA_CONSUMER_SECRET', self.consumer_secret),
            ('MPESA_BUSINESS_SHORTCODE', self.till_number),
            ('MPESA_PASSKEY', self.passkey),
        ]

        missing_vars = [var_name for var_name,
                        var_value in required_vars if not var_value]

        if missing_vars:
            raise ValueError(
                f"Missing required environment variables: {', '.join(missing_vars)}")

    def get_access_token(self):
        """Get OAuth access token from Safaricom."""
        try:
            credentials = base64.b64encode(
                f"{self.consumer_key}:{self.consumer_secret}".encode()
            ).decode()

            headers = {"Authorization": f"Basic {credentials}"}

            response = requests.get(self.auth_url, headers=headers, timeout=30)
            response.raise_for_status()

            return response.json().get("access_token")

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get M-Pesa access token: {e}")
            return None

    def generate_password(self):
        """Generate the base64 encoded password for STK push."""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        password_string = f"{self.till_number}{self.passkey}{timestamp}"
        password = base64.b64encode(password_string.encode()).decode()
        return password, timestamp

    def initiate_stk_push(self, phone_number, amount, order_reference):
        """Initiate STK Push payment."""
        try:
            access_token = self.get_access_token()
            if not access_token:
                return {"success": False, "error": "Failed to get access token"}

            password, timestamp = self.generate_password()

            if phone_number.startswith("0"):
                phone_number = "254" + phone_number[1:]
            elif phone_number.startswith("+"):
                phone_number = phone_number[1:]

            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }

            # --- CHANGE 3: Use the TILL NUMBER for the payload ---
            payload = {
                "BusinessShortCode": self.till_number,
                "Password": password,
                "Timestamp": timestamp,
                "TransactionType": "CustomerBuyGoodsOnline",
                "Amount": int(amount),
                "PartyA": phone_number,
                "PartyB": self.till_number,
                "PhoneNumber": phone_number,
                "CallBackURL": self.callback_url,
                "AccountReference": order_reference,
                "TransactionDesc": f"Payment for order {order_reference}"
            }

            logger.info(
                f"Initiating STK push to {self.stk_push_url} for {phone_number}, amount: {amount}")
            logger.info(f"Payload: {payload}")

            response = requests.post(
                self.stk_push_url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()

            result = response.json()
            logger.info(f"STK Push response: {result}")

            if result.get("ResponseCode") == "0":
                return {
                    "success": True,
                    "checkout_request_id": result.get("CheckoutRequestID"),
                    "merchant_request_id": result.get("MerchantRequestID"),
                    "response_description": result.get("ResponseDescription")
                }
            else:
                error_message = result.get("errorMessage", "STK Push failed")
                return {"success": False, "error": error_message}

        except requests.exceptions.RequestException as e:
            logger.error(f"STK Push request failed: {e}")
            return {"success": False, "error": f"{str(e)}"}
        except Exception as e:
            logger.error(f"An unexpected error occurred during STK Push: {e}")
            return {"success": False, "error": f"Payment initiation failed: {str(e)}"}


# Create global instance
mpesa_service = MpesaService()
