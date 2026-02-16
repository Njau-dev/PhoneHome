"""
Development server runner
Run with: python run.py
"""
import os
from app import create_app

# Force development environment
os.environ['FLASK_ENV'] = 'development'

# Create app
app = create_app('development')

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🚀 Starting Phone Home API - Development Server")
    print("="*50)
    print(f"Environment: {app.config.get('FLASK_ENV', 'development')}")
    print(f"Debug Mode: {app.config.get('DEBUG', False)}")
    print(
        f"Database: {app.config.get('SQLALCHEMY_DATABASE_URI', 'Not configured')[:50]}...")
    print("="*50 + "\n")

    # Run the development server
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )
