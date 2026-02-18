"""
Response Formatter Utility
Provides consistent API response formatting across the application.
"""


def format_response(success, data=None, message=None):
    """
    Formats API responses consistently.

    Args:
        success (bool): Indicates if the operation was successful.
        data (dict, optional): The response data payload.
        message (str, optional): A message describing the response.

    Returns:
        dict: Formatted response dictionary.
    """
    return {"success": success, "data": data, "message": message}
