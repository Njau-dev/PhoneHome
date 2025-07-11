import requests
import base64
from datetime import datetime
import logging
from flask import current_app
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class MpesaService:
    def __init__(self):
        # Load credentials from environment variables
        self.consumer_key = os.getenv('MPESA_CONSUMER_KEY')
        self.consumer_secret = os.getenv('MPESA_CONSUMER_SECRET')
        self.business_short_code = os.getenv('MPESA_BUSINESS_SHORTCODE')
        self.passkey = os.getenv('MPESA_PASSKEY')
        self.initiator_name = os.getenv('MPESA_INITIATOR_NAME')
        self.security_credential = os.getenv('MPESA_SECURITY_CREDENTIAL')

        
        # Environment configuration (sandbox or production)
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
        self.backend_url = os.getenv('BACKEND_URL', 'https://api.phonehome.co.ke')
        self.callback_url = f"{self.backend_url}/ganji/inaflow"
        print(self.callback_url)
        
        # Validate required environment variables
        self._validate_config()
    
    def _validate_config(self):
        """Validate that all required environment variables are set"""
        required_vars = [
            ('MPESA_CONSUMER_KEY', self.consumer_key),
            ('MPESA_CONSUMER_SECRET', self.consumer_secret),
            ('MPESA_BUSINESS_SHORTCODE', self.business_short_code),
            ('MPESA_PASSKEY', self.passkey),
            ('MPESA_INITIATOR_NAME', self.initiator_name),
            ('MPESA_SECURITY_CREDENTIAL', self.security_credential)
        ]
            
        missing_vars = []
        for var_name, var_value in required_vars:
            if not var_value:
                missing_vars.append(var_name)
        
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
    
    def get_config_summary(self):
        """Return a summary of the current configuration (for debugging)"""
        return {
            'environment': self.environment,
            'base_url': self.base_url,
            'business_short_code': self.business_short_code,
            'callback_url': self.callback_url,
            'consumer_key': self.consumer_key[:10] + '...' if self.consumer_key else None  # Masked for security
        }
    

    def get_access_token(self):
        """Get OAuth access token from Safaricom"""
        try:
            credentials = base64.b64encode(
                f"{self.consumer_key}:{self.consumer_secret}".encode()
            ).decode()
            
            headers = {
                "Authorization": f"Basic {credentials}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(self.auth_url, headers=headers, timeout=30)
            response.raise_for_status()
            
            return response.json().get("access_token")
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get M-Pesa access token: {str(e)}")
            return None
    
    def generate_password(self):
        """Generate password for STK push"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        password_string = f"{self.business_short_code}{self.passkey}{timestamp}"
        password = base64.b64encode(password_string.encode()).decode()
        return password, timestamp
    
    def initiate_stk_push(self, phone_number, amount, order_reference, account_reference="Order Payment"):
        """Initiate STK Push payment"""
        try:
            access_token = self.get_access_token()
            if not access_token:
                return {"success": False, "error": "Failed to get access token"}
            
            password, timestamp = self.generate_password()
            
            # Format phone number (ensure it starts with 254)
            if phone_number.startswith("0"):
                phone_number = "254" + phone_number[1:]
            elif phone_number.startswith("+254"):
                phone_number = phone_number[1:]
            elif not phone_number.startswith("254"):
                phone_number = "254" + phone_number
            
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "BusinessShortCode": self.business_short_code,
                "Password": password,
                "Timestamp": timestamp,
                "TransactionType": "CustomerPayBillOnline",
                "Amount": int(amount),  # Must be integer
                "PartyA": phone_number,
                "PartyB": self.business_short_code,
                "PhoneNumber": phone_number,
                "CallBackURL": self.callback_url,
                "AccountReference": account_reference,
                "TransactionDesc": f"Payment for order {order_reference}"
            }
            
            logger.info(f"Initiating STK push for {phone_number}, amount: {amount}")
            response = requests.post(self.stk_push_url, json=payload, headers=headers, timeout=30)
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
                return {
                    "success": False,
                    "error": result.get("ResponseDescription", "STK Push failed")
                }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"STK Push request failed: {str(e)}")
            return {"success": False, "error": f"Network error: {str(e)}"}
        except Exception as e:
            logger.error(f"STK Push failed: {str(e)}")
            return {"success": False, "error": f"Payment initiation failed: {str(e)}"}


# Create global instance
mpesa_service = MpesaService()