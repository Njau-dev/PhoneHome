"""
JWT callbacks configuration
"""
from app.models import BlacklistToken


def is_token_blacklisted(jwt_payload):
    """Check if token JTI is in blacklist"""
    jti = jwt_payload['jti']
    return BlacklistToken.query.filter_by(jti=jti).first() is not None


def setup_jwt_callbacks(jwt):
    """
    Setup all JWT callbacks

    Args:
        jwt: JWTManager instance
    """

    @jwt.token_in_blocklist_loader
    def check_if_token_in_blacklist(jwt_header, jwt_payload):
        """Callback to check if token is blacklisted"""
        return is_token_blacklisted(jwt_payload)

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        """Handle expired tokens"""
        return {
            "error": "Token expired",
            "message": "Please log in again"
        }, 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        """Handle invalid/malformed tokens"""
        return {
            "error": "Invalid token",
            "message": "Token is malformed or invalid"
        }, 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        """Handle missing tokens"""
        return {
            "error": "Authorization required",
            "message": "Access token is missing"
        }, 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        """Handle revoked/blacklisted tokens"""
        return {
            "error": "Token revoked",
            "message": "Token has been logged out"
        }, 401

    print("✅ JWT callbacks configured successfully")
