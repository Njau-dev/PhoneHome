"""
WSGI entry point for production (Gunicorn)
"""
import os

from app import create_app

# Get environment from environment variable
environment = os.getenv('FLASK_ENV', 'production')

# Create the application
app = create_app(environment)

if __name__ == '__main__':
    # This runs only in development when you do: python wsgi.py
    app.run(debug=(environment == 'development'))
