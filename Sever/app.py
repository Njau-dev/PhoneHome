from flask import Flask, jsonify, request, json, send_file, render_template_string
from flask_restful import Resource, Api
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, JWTManager
from flask_migrate import Migrate
from flask_cors import CORS
from datetime import timedelta, datetime, timezone
from functools import wraps
from app.models import (
    User, Admin, BlacklistToken,
    Category, Brand,
    Product, Phone, Laptop, Tablet, Audio, ProductVariation,
    Cart, CartItem,
    WishList, Compare, CompareItem,
    Order, OrderItem, Address,
    Payment,
    Review,
    Notification, AuditLog
)
import cloudinary
from io import BytesIO
from xhtml2pdf import pisa
import cloudinary.uploader
from services.email_service import (
    serializer, send_password_reset_email,
    send_order_confirmation, send_payment_notification,
    send_shipment_update, send_review_request, send_email
)
from services.mpesa_service import mpesa_service
from flask.views import MethodView
import os
import re
from dotenv import load_dotenv
import logging
import sys
from sqlalchemy import func
import traceback
from sqlalchemy.exc import SQLAlchemyError
from collections import defaultdict
from redis import Redis
from rq import Queue
from app.extensions import db

load_dotenv(override=True)

# Initialize Flask app
app = Flask(__name__)

logger = logging.getLogger(__name__)
handler = logging.StreamHandler()
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# This configures Flask to use Gunicorn's stderr - for production
gunicorn_logger = logging.getLogger('gunicorn.error')
app.logger.handlers = gunicorn_logger.handlers
app.logger.setLevel(logging.INFO)

# Validate environment variables
required_env_vars = [
    'SQLALCHEMY_DATABASE_URI',
    'SECRET_KEY',
    'JWT_SECRET_KEY',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'FRONTEND_URL'
]

missing_vars = [var for var in required_env_vars if not os.getenv(var)]
if missing_vars:
    raise ValueError(
        f"Missing required environment variables: {', '.join(missing_vars)}")

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    debug=True,
    secure=True
)

# Configure Flask app
app.config.update(
    SECRET_KEY=os.getenv('SECRET_KEY'),
    SQLALCHEMY_DATABASE_URI=os.getenv('SQLALCHEMY_DATABASE_URI'),
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
    JWT_SECRET_KEY=os.getenv('JWT_SECRET_KEY'),
    FRONTEND_URL=os.getenv('FRONTEND_URL', 'https://phonehome.co.ke')
)


def sync_admin_users():
    """Sync users with admin role to the admins table"""
    try:
        # Get all users with admin role
        admin_users = User.query.filter_by(role="admin").all()
        logger.info(f"Found {len(admin_users)} admin users to sync")

        for user in admin_users:
            # Check if admin already exists in admins table
            existing_admin = Admin.query.filter_by(email=user.email).first()

            if not existing_admin:
                # Create new admin entry
                new_admin = Admin(
                    username=user.username,
                    email=user.email,
                    password_hash=user.password_hash
                )

                try:
                    # First add and flush to get the admin ID
                    db.session.add(new_admin)
                    db.session.flush()

                    # Now create audit log with the new admin's ID
                    audit_log = AuditLog(
                        admin_id=new_admin.id,  # Now we have the ID
                        action=f"Admin account auto-created for user {user.username} (ID: {user.id})"
                    )
                    db.session.add(audit_log)

                    # Create notification for the user
                    notification = Notification(
                        user_id=user.id,
                        message="Your admin account has been created. You can now login to the admin dashboard.",
                        is_read=False
                    )
                    db.session.add(notification)

                    # Finally commit everything
                    db.session.commit()
                    logger.info(
                        f"Created admin account for user {user.username}")

                except SQLAlchemyError as e:
                    db.session.rollback()
                    logger.error(
                        f"Database error creating admin for user {user.id}: {str(e)}")
                    continue

    except Exception as e:
        logger.error(
            f"Error in sync_admin_users: {str(e)}\n{traceback.format_exc()}")


# Initialize Extensions
db.init_app(app)
migrate = Migrate(app, db)
cors = CORS(app)
api = Api(app)
jwt = JWTManager(app)

# Initialize admin sync within app context
with app.app_context():
    try:
        sync_admin_users()
        logger.info("Successfully completed initial admin sync")
    except Exception as e:
        logger.error(f"Error in initial admin sync: {str(e)}")


# Token Blacklist Model
class BlacklistToken(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(500), nullable=False, unique=True)

# Function to check if token is blacklisted


def is_token_blacklisted(jwt_payload):
    jti = jwt_payload['jti']
    return BlacklistToken.query.filter_by(token=jti).first() is not None

# Load JWT into blacklist checker


@jwt.token_in_blocklist_loader
def check_if_token_in_blacklist(jwt_header, jwt_payload):
    return is_token_blacklisted(jwt_payload)


# Define the admin_required decorator
def admin_required(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        current_user_id = get_jwt_identity()
        admin = db.session.get(Admin, current_user_id)
        if not admin:
            return {"Error": "Admin privileges required"}, 403
        return f(*args, **kwargs)
    return decorator


# Allowed extensions for file uploads
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'avif'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# Rate limiting setup
redis_conn = Redis()
q = Queue(connection=redis_conn)


def rate_limit(key_prefix, limit, period):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            key = f"{key_prefix}:{request.remote_addr}"
            current = redis_conn.get(key)

            if current and int(current) >= limit:
                return jsonify({
                    "error": "Too many requests",
                    "message": f"Please wait {period} seconds before trying again"
                }), 429

            pipe = redis_conn.pipeline()
            pipe.incr(key)
            pipe.expire(key, period)
            pipe.execute()

            return f(*args, **kwargs)
        return wrapped
    return decorator


class ForgotPasswordResource(Resource):
    @rate_limit("pwd_reset", int(os.getenv("RESET_EMAIL_LIMIT", 3)), 3600)
    def post(self):
        try:
            email = request.json.get('email')

            if not email:
                return {"error": "Email is required"}, 400

            # Validate email format
            if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
                return {"error": "Invalid email format"}, 400

            user = User.query.filter_by(email=email).first()

            if not user:
                return {"message": "If that email exists, we've sent a reset link"}, 200

            try:
                token = serializer.dumps(email, salt='password-reset')
                reset_url = f"{app.config['FRONTEND_URL']}/reset-password/{token}"

                user.reset_token = token
                user.reset_token_expiration = datetime.now(timezone.utc) + timedelta(
                    seconds=int(os.getenv("PASSWORD_RESET_TIMEOUT", 3600))
                )
                db.session.commit()

                email_sent = send_password_reset_email(email, reset_url)

                if not email_sent:
                    logger.error(
                        f"Failed to send password reset email to {email}")
                    return {"error": "Failed to send reset email"}, 500

                return {"message": "Password reset email sent"}, 200

            except Exception as e:
                db.session.rollback()
                logger.error(f"Error in password reset process: {str(e)}")
                return {"error": "An error occurred processing your request"}, 500

        except Exception as e:
            logger.error(f"Unexpected error in forgot password: {str(e)}")
            return {"error": "An unexpected error occurred"}, 500


class ResetPasswordResource(Resource):
    def post(self, token):
        try:
            if not request.json or 'password' not in request.json:
                return {"error": "New password is required"}, 400

            new_password = request.json.get('password')
            if len(new_password) < 8:
                return {"error": "Password must be at least 8 characters long"}, 400

            try:
                email = serializer.loads(
                    token,
                    salt='password-reset',
                    max_age=int(os.getenv("PASSWORD_RESET_TIMEOUT", 3600))
                )
            except Exception:
                return {"error": "Invalid or expired token"}, 400

            user = User.query.filter_by(email=email, reset_token=token).first()
            if not user:
                return {"error": "Invalid reset request"}, 400

            if user.reset_token_expiration < datetime.now(timezone.utc):
                return {"error": "Reset token has expired"}, 400

            try:
                user.password_hash = generate_password_hash(new_password)
                user.reset_token = None
                user.reset_token_expiration = None
                # Create notification for the user
                notification = Notification(
                    user_id=user.id,
                    message="Your password has been reset successfully.",
                    is_read=False
                )
                db.session.add(notification)
                db.session.commit()

                return {"message": "Password reset successful"}, 200

            except Exception as e:
                db.session.rollback()
                logger.error(f"Database error during password reset: {str(e)}")
                return {"error": "Error updating password"}, 500

        except Exception as e:
            logger.error(f"Unexpected error in password reset: {str(e)}")
            return {"error": "An unexpected error occurred"}, 500


# Sign Up
class SignUp(Resource):
    def post(self):
        try:
            data = request.get_json()
            username = data.get('username')
            email = data.get('email')
            phone_number = data.get('phone_number')
            password = data.get('password')

            if not all([email, phone_number, password, username]):
                return {"Error": "Missing required fields"}, 400

            if User.query.filter_by(email=email).first():
                return {"Error": "Email Already Exists"}, 409

            hashed_password = generate_password_hash(password)
            new_user = User(
                username=username,
                email=email,
                phone_number=phone_number,
                password_hash=hashed_password
            )

            db.session.add(new_user)
            db.session.commit()

            notification = Notification(
                user_id=new_user.id,
                message="Your account has been created successfully.",
                is_read=False
            )
            db.session.add(notification)
            db.session.commit()

            # Generate token for the new user
            token = create_access_token(
                identity=str(new_user.id),
                expires_delta=timedelta(days=1)
            )

            return {
                "Message": "Sign-Up Successful!",
                "token": token,
                "user": {
                    "id": new_user.id,
                    "username": new_user.username,
                    "email": new_user.email
                }
            }, 201

        except Exception as e:
            logger.error("Error during Sign Up:\n" + traceback.format_exc())
            return {"Error": "Internal Server Error"}, 500

# Login


class Login(Resource):
    def post(self):
        data = request.get_json()
        email = data['email']
        password = data['password']

        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password_hash, password):
            token = create_access_token(
                identity=str(user.id),
                expires_delta=timedelta(days=1)
            )
            return {
                "message": "Login successful",
                "token": token,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role or "user"  # Default to "user" if role is None
                }
            }, 200
        else:
            return {"error": "Invalid Email or Password!"}, 400

# Profile View and Update


class ProfileView(MethodView):
    @jwt_required()
    def get(self):
        current_user_id = get_jwt_identity()
        user = db.session.get(User, current_user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        user_data = {
            "username": user.username,
            "email": user.email,
            "phone_number": user.phone_number,
            "address": user.address,
            "created_at": user.created_at.isoformat()
        }

        return jsonify(user_data), 200

    def put(self):
        current_user_id = get_jwt_identity()
        user = db.session.get(User, current_user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.get_json()

        user.username = data.get('username', user.username)
        user.email = data.get('email', user.email)
        user.phone_number = data.get('phone_number', user.phone_number)
        user.address = data.get('address', user.address)

        try:
            db.session.commit()
            return jsonify({"message": "Profile updated successfully"}), 200
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating profile: {e}")
            return jsonify({"error": "An error occurred while updating the profile."}), 500


# Profile Stats
class ProfileStatsView(MethodView):
    @jwt_required()
    def get(self):
        current_user_id = get_jwt_identity()
        user = db.session.get(User, current_user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        try:
            # Get order count
            order_count = Order.query.filter_by(
                user_id=current_user_id).count()

            # Get total payment amount (only for successful payments)
            total_payment = db.session.query(func.sum(Order.total_amount)).\
                join(Payment, Order.order_reference == Payment.order_reference).\
                filter(Order.user_id == current_user_id, Payment.status == 'Success').\
                scalar() or 0

            # Get wishlist count - modified to count items in wishlist_products
            wishlist = WishList.query.filter_by(
                user_id=current_user_id).first()
            wishlist_count = len(wishlist.products) if wishlist else 0

            # Get review count
            review_count = Review.query.filter_by(
                user_id=current_user_id).count()

            stats = {
                "order_count": order_count,
                "total_payment": round(float(total_payment), 2),
                "wishlist_count": wishlist_count,
                "review_count": review_count
            }

            return jsonify(stats), 200

        except Exception as e:
            logger.error(f"Error fetching profile stats: {e}")
            return jsonify({"error": "An error occurred while fetching profile stats."}), 500


# Profile Orders
class ProfileOrdersView(MethodView):
    @jwt_required()
    def get(self):
        try:
            current_user_id = get_jwt_identity()
            user = db.session.get(User, current_user_id)

            if not user:
                return jsonify({"error": "User not found"}), 404

            # Get recent orders with all necessary relationships
            orders = (Order.query
                      .filter_by(user_id=current_user_id)
                      .order_by(Order.created_at.desc())
                      .limit(5)
                      .all())

            recent_orders = []
            for order in orders:
                # Get order items with product details
                items = []
                for order_item in order.order_items:
                    if order_item.product:  # Check if product exists
                        item_data = {
                            "id": order_item.product.id,
                            "name": order_item.product.name,
                            "brand": order_item.product.brand.name if order_item.product.brand else None,
                            "image_url": order_item.product.image_urls[0] if order_item.product.image_urls else None,
                            "quantity": order_item.quantity,
                            "variation_name": order_item.variation_name,
                            "price": order_item.variation_price or order_item.product.price
                        }
                        items.append(item_data)

                order_data = {
                    "id": order.id,
                    "order_reference": order.order_reference,
                    # Ensure it's a float
                    "total_amount": float(order.total_amount),
                    "status": order.status,
                    "date": order.created_at.isoformat(),
                    "showOrderDetails": True,  # Add this flag for frontend
                    "items": items,
                    "payment_status": order.payment.status if order.payment else "Pending",
                    "payment_method": order.payment.payment_method if order.payment else "N/A"
                }
                recent_orders.append(order_data)

            return jsonify(recent_orders), 200

        except Exception as e:
            logger.error(f"Error fetching profile orders: {str(e)}")
            logger.error(f"Stack trace: {traceback.format_exc()}")
            return jsonify({"error": "An error occurred while fetching profile orders"}), 500

# Profile Wishlist


class ProfileWishlistView(MethodView):
    @jwt_required()
    def get(self):
        try:
            current_user_id = get_jwt_identity()
            wishlist = WishList.query.filter_by(
                user_id=current_user_id).first()

            if not wishlist:
                return jsonify({"message": "Wishlist is empty!"}), 200

            wishlist_items = []
            for product in wishlist.products:
                item_data = {
                    "id": product.id,
                    "product_name": product.name,
                    "brand": product.brand.name if product.brand else "N/A",
                    "image_url": product.image_urls[0] if product.image_urls else None,
                    "price": product.price
                }
                wishlist_items.append(item_data)

            return jsonify({"wishlist": wishlist_items}), 200

        except Exception as e:
            logger.error(
                f"Error fetching profile wishlist: {str(e)}\n{traceback.format_exc()}")
            return jsonify({"error": "An error occurred while fetching profile wishlist."}), 500

# Logout


class Logout(Resource):
    @jwt_required()
    def delete(self):
        jti = get_jwt_identity()
        blacklisted_token = BlacklistToken(token=jti)
        db.session.add(blacklisted_token)
        db.session.commit()
        return {"Message": "Logout Successful!"}, 200


# Product (Phones, Laptops, Tablets, Audio) Management
class ProductResource(Resource):
    def get(self):
        try:
            # Retrieve all products from the relevant tables
            product_types = {
                'phone': Phone.query.all(),
                'laptop': Laptop.query.all(),
                'tablet': Tablet.query.all(),
                'audio': Audio.query.all()
            }

            all_products = []

            def serialize_product(product, product_type):
                # Calculate average rating
                reviews = Review.query.filter_by(product_id=product.id).all()
                avg_rating = 0
                if reviews:
                    avg_rating = sum(
                        review.rating for review in reviews) / len(reviews)
                    # Round to 1 decimal place
                    avg_rating = round(avg_rating, 1)

                base_data = {
                    'id': product.id,
                    'name': product.name,
                    'price': product.price,
                    'description': product.description,
                    'image_urls': product.image_urls,
                    'category': product.category.name,
                    'brand': product.brand.name,
                    'type': product_type,
                    'hasVariation': product.hasVariation,
                    'isBestSeller': product.isBestSeller,
                    'rating': avg_rating,  # Added average rating
                    'review_count': len(reviews)  # Added count of reviews
                }

                if product_type == 'phone':
                    additional_data = {
                        'ram': product.ram,
                        'storage': product.storage,
                        'battery': product.battery,
                        'main_camera': product.main_camera,
                        'front_camera': product.front_camera,
                        'display': product.display,
                        'processor': product.processor,
                        'connectivity': product.connectivity,
                        'colors': product.colors,
                        'os': product.os
                    }
                elif product_type == 'laptop':
                    additional_data = {
                        'ram': product.ram,
                        'storage': product.storage,
                        'battery': product.battery,
                        'display': product.display,
                        'processor': product.processor,
                        'os': product.os
                    }
                elif product_type == 'tablet':
                    additional_data = {
                        'ram': product.ram,
                        'storage': product.storage,
                        'battery': product.battery,
                        'main_camera': product.main_camera,
                        'front_camera': product.front_camera,
                        'display': product.display,
                        'processor': product.processor,
                        'connectivity': product.connectivity,
                        'colors': product.colors,
                        'os': product.os
                    }
                elif product_type == 'audio':
                    additional_data = {
                        'battery': product.battery
                    }
                else:
                    additional_data = {}

                # **Include Variations if `hasVariation` is True**
                variations = []
                if product.hasVariation:
                    for variation in product.variations:
                        variations.append({
                            'id': variation.id,
                            'ram': variation.ram,
                            'storage': variation.storage,
                            'price': variation.price
                        })

                # **Add variations to the response if available**
                base_data['variations'] = variations

                return {**base_data, **additional_data}

            # Iterate over all product types and serialize them
            for product_type, products in product_types.items():
                for product in products:
                    all_products.append(
                        serialize_product(product, product_type))

            return {'products': all_products}, 200

        except Exception as e:
            logger.error(f"Error fetching products: {e}")
            return {"Error": "An error occurred while fetching products"}, 500

    @jwt_required()
    @admin_required
    def post(self):
        try:
            # Validate input data
            name = request.form.get('name')
            price = request.form.get('price')
            description = request.form.get('description')
            category_id = request.form.get('category_id')
            brand_id = request.form.get('brand_id')
            product_type = request.form.get('type')
            image_files = request.files.getlist('image_urls')

            hasVariation = request.form.get('hasVariation', 'false').lower(
            ) == 'true'  # Boolean flag for variations
            isBestSeller = request.form.get('isBestSeller', 'false').lower(
            ) == 'true'  # Boolean flag for bestseller

            # Ensure required fields are provided
            if not all([name, price, description, category_id, brand_id, product_type, image_files]):
                return {"Error": "Missing required fields"}, 400

            # Validate image files
            uploaded_urls = []
            for image_file in image_files:
                if image_file and allowed_file(image_file.filename):
                    try:
                        logger.info(
                            f"Uploading {image_file.filename} to Cloudinary...")
                        result = cloudinary.uploader.upload(image_file)
                        # Store secure URL from Cloudinary
                        uploaded_urls.append(result['secure_url'])
                        logger.info(f"Uploaded to: {result['secure_url']}")
                    except cloudinary.exceptions.Error as e:
                        logger.error(
                            f"Cloudinary upload failed for {image_file.filename}: {e}")
                        return {"Error": f"Image upload failed for {image_file.filename}: {str(e)}"}, 500
                else:
                    return {"Error": f"Invalid file type for {image_file.filename}."}, 400

            # Ensure some images were uploaded
            if not uploaded_urls:
                return {"Error": "No valid images were uploaded."}, 400

            # Find category and brand
            category = Category.query.get_or_404(category_id)
            brand = Brand.query.get_or_404(brand_id)

            # Handle product creation based on type
            if product_type == 'phone':
                product = Phone(
                    name=name,
                    price=price,
                    description=description,
                    image_urls=uploaded_urls,
                    ram=request.form.get('ram'),
                    storage=request.form.get('storage'),
                    battery=request.form.get('battery'),
                    main_camera=request.form.get('main_camera'),
                    front_camera=request.form.get('front_camera'),
                    display=request.form.get('display'),
                    processor=request.form.get('processor'),
                    connectivity=request.form.get('connectivity'),
                    colors=request.form.get('colors'),
                    os=request.form.get('os'),
                    category=category,
                    brand=brand,
                    hasVariation=hasVariation,
                    isBestSeller=isBestSeller
                )
            elif product_type == 'laptop':
                product = Laptop(
                    name=name,
                    price=price,
                    description=description,
                    image_urls=uploaded_urls,
                    ram=request.form.get('ram'),
                    storage=request.form.get('storage'),
                    battery=request.form.get('battery'),
                    display=request.form.get('display'),
                    processor=request.form.get('processor'),
                    os=request.form.get('os'),
                    category=category,
                    brand=brand,
                    hasVariation=hasVariation,  # **New Field**
                    isBestSeller=isBestSeller   # **New Field**
                )
            elif product_type == 'tablet':
                product = Tablet(
                    name=name,
                    price=price,
                    description=description,
                    image_urls=uploaded_urls,
                    ram=request.form.get('ram'),
                    storage=request.form.get('storage'),
                    battery=request.form.get('battery'),
                    main_camera=request.form.get('main_camera'),
                    front_camera=request.form.get('front_camera'),
                    display=request.form.get('display'),
                    processor=request.form.get('processor'),
                    connectivity=request.form.get('connectivity'),
                    colors=request.form.get('colors'),
                    os=request.form.get('os'),
                    category=category,
                    brand=brand,
                    hasVariation=hasVariation,  # **New Field**
                    isBestSeller=isBestSeller   # **New Field**
                )
            elif product_type == 'audio':
                product = Audio(
                    name=name,
                    price=price,
                    description=description,
                    image_urls=uploaded_urls,
                    battery=request.form.get('battery'),
                    category=category,
                    brand=brand,
                    hasVariation=hasVariation,  # **New Field**
                    isBestSeller=isBestSeller   # **New Field**
                )
            else:
                return {"Error": "Invalid product type"}, 400

            # Add and commit product to the database
            db.session.add(product)
            db.session.commit()

            # **New Variation Handling Logic**:
            if hasVariation:
                # Expecting a JSON array of variations in the form data
                variations = request.form.get('variations')
                if variations:
                    variations_list = json.loads(variations)
                    for variation in variations_list:
                        ram = variation.get('ram')
                        storage = variation.get('storage')
                        price = float(variation.get('price', 0))

                        new_variation = ProductVariation(
                            product_id=product.id,
                            ram=ram,
                            storage=storage,
                            price=price
                        )
                        db.session.add(new_variation)

                    db.session.commit()

            logger.info(f"Product {name} added successfully")
            return {"Message": f"{product_type.capitalize()} added successfully!"}, 201

        except Exception as e:
            db.session.rollback()  # Rollback in case of error
            logger.error(f"Error adding product: {e}")
            return {"Error": "An error occurred while adding the product"}, 500


class ProductUpdateResource(Resource):
    @jwt_required()
    @admin_required
    def put(self, product_id):
        try:
            # Determine the product type and fetch the product by its ID
            product = (
                Phone.query.get(product_id) or
                Tablet.query.get(product_id) or
                Laptop.query.get(product_id) or
                Audio.query.get(product_id)
            )

            if not product:
                return {"Error": "Product not found"}, 404

            # Basic product details update
            product.name = request.form.get('name', product.name)
            product.price = request.form.get('price', product.price)
            product.description = request.form.get(
                'description', product.description)
            product.category_id = request.form.get(
                'category_id', product.category_id)
            product.brand_id = request.form.get('brand_id', product.brand_id)
            product.isBestSeller = request.form.get(
                'isBestSeller', str(product.isBestSeller)).lower() == 'true'
            product.hasVariation = request.form.get(
                'hasVariation', str(product.hasVariation)).lower() == 'true'

            # Append new images to the existing list
            new_images = request.files.getlist('image_urls')
            if new_images:
                uploaded_urls = []
                for image_file in new_images:
                    if image_file and allowed_file(image_file.filename):
                        result = cloudinary.uploader.upload(image_file)
                        uploaded_urls.append(result['secure_url'])
                product.image_urls.extend(uploaded_urls)

            # Update fields specific to product type
            if isinstance(product, Phone) or isinstance(product, Tablet):
                product.ram = request.form.get('ram', product.ram)
                product.storage = request.form.get('storage', product.storage)
                product.battery = request.form.get('battery', product.battery)
                product.display = request.form.get('display', product.display)
                product.processor = request.form.get(
                    'processor', product.processor)
                product.main_camera = request.form.get(
                    'main_camera', product.main_camera)
                product.front_camera = request.form.get(
                    'front_camera', product.front_camera)
                product.connectivity = request.form.get(
                    'connectivity', product.connectivity)
                product.colors = request.form.get('colors', product.colors)
                product.os = request.form.get('os', product.os)
            elif isinstance(product, Laptop):
                product.ram = request.form.get('ram', product.ram)
                product.storage = request.form.get('storage', product.storage)
                product.battery = request.form.get('battery', product.battery)
                product.display = request.form.get('display', product.display)
                product.processor = request.form.get(
                    'processor', product.processor)
                product.os = request.form.get('os', product.os)
            elif isinstance(product, Audio):
                product.battery = request.form.get('battery', product.battery)

            # **Update variations if hasVariation is True**
            if product.hasVariation:
                variations_data = request.form.get('variations')
                if variations_data:
                    import json
                    variations = json.loads(variations_data)
                    for variation in variations:
                        ram = variation.get('ram')
                        storage = variation.get('storage')
                        price = variation.get('price', 0)

                        # Check if a variation with same RAM and storage exists
                        existing_variation = next(
                            (v for v in product.variations if v.ram ==
                             ram and v.storage == storage), None
                        )

                        if existing_variation:
                            # Update price if variation exists
                            existing_variation.price = price
                        else:
                            # Add new variation if it doesn't exist
                            new_variation = ProductVariation(
                                product_id=product.id,
                                ram=ram,
                                storage=storage,
                                price=price
                            )
                            db.session.add(new_variation)

            # Commit changes
            db.session.commit()
            return {"Message": "Product updated successfully"}, 200

        except Exception as e:
            db.session.rollback()
            return {"Error": f"An error occurred: {str(e)}"}, 500


class ProductVariationResource(Resource):
    def post(self, product_id):
        try:
            # Find the product by ID
            product = Product.query.get_or_404(product_id)

            # Assume you get the variation details as JSON in the request body
            variation_data = request.json

            # Loop through each variation provided in the request
            for var in variation_data.get('variations', []):
                variation = ProductVariation(
                    ram=var.get('ram'),
                    storage=var.get('storage'),
                    price=var.get('price'),
                    product_id=product.id  # Associate with the product
                )
                db.session.add(variation)

            # Commit the changes
            db.session.commit()

            return {"message": "Variations added successfully!"}, 201
        except Exception as e:
            db.session.rollback()
            return {"error": f"An error occurred: {str(e)}"}, 500


# Get Products by Type (Phone, Laptop, Tablet, Audio)
class GetProductsByType(Resource):
    def get(self, product_type):
        try:
            if product_type == 'phone':
                products = Phone.query.all()
            elif product_type == 'laptop':
                products = Laptop.query.all()
            elif product_type == 'tablet':
                products = Tablet.query.all()
            elif product_type == 'audio':
                products = Audio.query.all()
            else:
                return {"Error": "Invalid product type"}, 400

            return [
                {
                    "id": product.id,
                    "name": product.name,
                    "price": product.price,
                    "category": product.category.name,
                    "brand": product.brand.name,
                    "image_urls": product.image_urls
                }
                for product in products
            ], 200

        except Exception as e:
            logger.error(f"Error fetching products by type: {e}")
            return {"Error": "An error occurred while retrieving the products"}, 500

# Get Products by Category


class GetProductsByCategory(Resource):
    def get(self, category_id):
        try:
            category = Category.query.get_or_404(category_id)
            products = Product.query.filter_by(category_id=category.id).all()

            return [
                {
                    "id": product.id,
                    "name": product.name,
                    "price": product.price,
                    "type": product.type,
                    "brand": product.brand.name,
                    "image_urls": product.image_urls
                }
                for product in products
            ], 200

        except Exception as e:
            logger.error(f"Error fetching products by category: {e}")
            return {"Error": "An error occurred while retrieving the products"}, 500

# Get Product by ID


class GetProductById(Resource):
    def get(self, product_id):
        try:
            product = Product.query.get_or_404(product_id)
            category = product.category.name

            # Get reviews for this product
            reviews = Review.query.filter_by(product_id=product.id).all()

            # Calculate average rating
            avg_rating = 0
            if reviews:
                avg_rating = sum(
                    review.rating for review in reviews) / len(reviews)
                # Round to 1 decimal place
                avg_rating = round(avg_rating, 1)

            # Serialize reviews
            serialized_reviews = []
            for review in reviews:
                # Get the user who wrote the review
                user = User.query.get(review.user_id)
                user_name = user.username if user else "Anonymous"

                serialized_reviews.append({
                    "id": review.id,
                    "user_id": review.user_id,
                    "user_name": user_name,
                    "rating": review.rating,
                    "comment": review.comment,
                    "created_at": review.created_at.strftime("%Y-%m-%d %H:%M:%S")
                })

            # Base product data that all products share
            product_data = {
                "id": product.id,
                "name": product.name,
                "price": product.price,
                "brand": product.brand.name,
                "category": product.category.name,
                "description": product.description,
                "image_urls": product.image_urls,
                "type": product.type,
                "hasVariation": product.hasVariation,
                "isBestSeller": product.isBestSeller,
                "rating": avg_rating,
                "review_count": len(reviews),
                "reviews": serialized_reviews
            }

            # If product has variations, fetch and include them
            if product.hasVariation:
                variations = [
                    {
                        "id": variation.id,
                        "ram": variation.ram,
                        "storage": variation.storage,
                        "price": variation.price
                    }
                    for variation in ProductVariation.query.filter_by(product_id=product.id).all()
                ]
                product_data["variations"] = variations

            # Use switch-case logic based on product category
            if category == 'Phone' or category == 'Tablet':
                product_data.update({
                    "ram": product.ram,
                    "storage": product.storage,
                    "battery": product.battery,
                    "main_camera": product.main_camera,
                    "front_camera": product.front_camera,
                    "display": product.display,
                    "processor": product.processor,
                    "connectivity": product.connectivity,
                    "colors": product.colors,
                    "os": product.os
                })
            elif category == 'Laptop':
                product_data.update({
                    "ram": product.ram,
                    "storage": product.storage,
                    "battery": product.battery,
                    "display": product.display,
                    "processor": product.processor,
                    "os": product.os
                })
            elif category == 'Audio':
                product_data.update({
                    "battery": product.battery
                })

            return product_data, 200

        except Exception as e:
            logger.error(f"Error fetching product by ID: {e}")
            return {"Error": "An error occurred while fetching the product"}, 500


# Delete Product by ID
class DeleteProductById(Resource):
    def delete(self, product_id):
        try:
            # Fetch the product by ID or return 404 if not found
            product = Product.query.get_or_404(product_id)
            logger.info(
                f"Attempting to delete product with ID {product_id}: {product.name}")

            try:
                # Delete related cart items first
                CartItem.query.filter_by(product_id=product_id).delete()

                # Delete related order items (if you want to preserve order history, consider soft deletes)
                OrderItem.query.filter_by(product_id=product_id).delete()

                # Remove from wishlists
                wishlists = WishList.query.all()
                for wishlist in wishlists:
                    if product in wishlist.products:
                        wishlist.products.remove(product)

                # Remove from compare lists
                CompareItem.query.filter_by(product_id=product_id).delete()

                # Delete product variations
                ProductVariation.query.filter_by(
                    product_id=product_id).delete()

                # Delete reviews
                Review.query.filter_by(product_id=product_id).delete()

                # Finally delete the product
                db.session.delete(product)
                db.session.commit()

                logger.info(
                    f"Product with ID {product_id} deleted successfully")
                return {"Message": f"{product.name} deleted successfully"}, 200

            except SQLAlchemyError as e:
                db.session.rollback()
                logger.error(
                    f"Database error deleting product {product_id}: {str(e)}")
                return {"Error": "Database error occurred while deleting product"}, 500

        except Exception as e:
            logger.error(
                f"Error deleting product with ID {product_id}: {str(e)}")
            return {"Error": "An error occurred while deleting the product"}, 500


# Cart Management
class CartResource(Resource):
    @jwt_required()
    def get(self):
        current_user_id = str(get_jwt_identity())

        try:
            cart = Cart.query.filter_by(user_id=current_user_id).first()
            if not cart:
                return {"cart": {}}, 200

            cart_items = CartItem.query.filter_by(cart_id=cart.id).all()
            if not cart_items:
                return {"cart": {}}, 200

            # Group items by product_id
            grouped_items = defaultdict(dict)
            for item in cart_items:
                variation_name = item.variation_name or None
                grouped_items[item.product_id][variation_name] = {
                    "quantity": item.quantity,
                    "price": item.variation_price or item.product.price
                }

            return {"cart": grouped_items}, 200

        except SQLAlchemyError as e:
            print(f"Database error: {e}")
            return {"Error": "Database error."}, 500

        except Exception as e:
            print(f"Unexpected error: {e}")
            return {"Error": "Unexpected error."}, 500

    @jwt_required()
    def post(self):
        current_user_id = str(get_jwt_identity())

        try:
            # Parse request data
            data = request.get_json()

            # Validate required fields
            if not data or 'productId' not in data or 'quantity' not in data:
                return {"Error": "Invalid request. 'productId' and 'quantity' are required."}, 400

            try:
                # Convert productId to integer
                product_id = int(data['productId'])
            except ValueError:
                return {"Error": "Invalid 'productId'. Must be an integer."}, 400

            if not isinstance(data['quantity'], int) or data['quantity'] <= 0:
                return {"Error": "Invalid 'quantity'. Must be a positive integer."}, 400

            # Fetch or create the user's cart
            cart = Cart.query.filter_by(user_id=current_user_id).first()
            if not cart:
                cart = Cart(user_id=current_user_id)
                db.session.add(cart)
                db.session.commit()

            # Fetch product and validate existence
            product = db.session.get(Product, product_id)
            if not product:
                return {"Error": f"Product with ID {product_id} not found."}, 400

            # Handle variations if provided
            variation_name = None
            variation_price = None
            if data.get('selectedVariation'):
                variation = data['selectedVariation']
                if not isinstance(variation, dict):
                    return {"Error": "Invalid 'selectedVariation'. Must be an object."}, 400

                if 'ram' not in variation or 'storage' not in variation or 'price' not in variation:
                    return {"Error": "Invalid 'selectedVariation' data. 'ram', 'storage', and 'price' are required."}, 400

                variation_name = f"{variation['ram']} - {variation['storage']}"
                variation_price = variation['price']

                if not isinstance(variation_price, (int, float)) or variation_price <= 0:
                    return {"Error": "Invalid variation price. Must be a positive number."}, 400

            # Check if the cart item already exists
            cart_item = CartItem.query.filter_by(
                cart_id=cart.id,
                product_id=product.id,
                variation_name=variation_name
            ).first()

            if cart_item:
                cart_item.quantity += data['quantity']
            else:
                cart_item = CartItem(
                    cart_id=cart.id,
                    product_id=product.id,
                    quantity=data['quantity'],
                    variation_name=variation_name,
                    variation_price=variation_price
                )
                db.session.add(cart_item)

            db.session.commit()
            return {"Message": "Product added to cart successfully!"}, 201

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"Error": f"Database error: {str(e)}"}, 500
        except KeyError as e:
            return {"Error": f"Missing required key: {str(e)}"}, 400
        except ValueError as e:
            return {"Error": f"Invalid value: {str(e)}"}, 400
        except Exception as e:
            return {"Error": f"Unexpected error: {str(e)}"}, 500

    @jwt_required()
    def put(self):
        current_user_id = get_jwt_identity()

        try:
            # Parse request data
            data = request.get_json()

            # Validate required fields
            if not data or 'productId' not in data or 'quantity' not in data:
                return {"Error": "Invalid request. 'productId' and 'quantity' are required."}, 400

            try:
                # Convert productId to integer
                product_id = int(data['productId'])
            except ValueError:
                return {"Error": "Invalid 'productId'. Must be an integer."}, 400

            if not isinstance(data['quantity'], int) or data['quantity'] <= 0:
                return {"Error": "Invalid 'quantity'. Must be a positive integer."}, 400

            # Fetch the user's cart
            cart = Cart.query.filter_by(user_id=current_user_id).first()
            if not cart:
                return {"Error": "Cart is empty!"}, 404

            # Check if the cart item exists
            variation_name = None
            if data.get('selectedVariation'):
                variation_name = data['selectedVariation']
                variation_name = None if variation_name in [
                    'null', None, ''] else variation_name

            cart_item = CartItem.query.filter_by(
                cart_id=cart.id,
                product_id=product_id,
                variation_name=variation_name
            ).first()

            if not cart_item:
                return {"Error": "Cart item not found!"}, 404

            # Update the quantity
            cart_item.quantity = data['quantity']
            db.session.commit()

            return {"Message": "Cart item quantity updated successfully!"}, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"Error": f"Database error: {str(e)}"}, 500
        except Exception as e:
            return {"Error": f"Unexpected error: {str(e)}"}, 500

    @jwt_required()
    def delete(self):
        current_user_id = get_jwt_identity()

        try:
            # Parse request data
            data = request.get_json()

            # Validate required fields
            if not data or 'productId' not in data:
                return {"Error": "Invalid request. 'productId' is required."}, 400

            try:
                # Convert productId to integer
                product_id = int(data['productId'])
            except ValueError:
                return {"Error": "Invalid 'productId'. Must be an integer."}, 400

            # Fetch the user's cart
            cart = Cart.query.filter_by(user_id=current_user_id).first()
            if not cart:
                return {"Error": "Cart is empty!"}, 404

            # Check if the cart item exists
            variation_name = None
            if data.get('selectedVariation'):
                variation_name = data['selectedVariation']
                variation_name = None if variation_name in [
                    'null', None, ''] else variation_name

            cart_item = CartItem.query.filter_by(
                cart_id=cart.id,
                product_id=product_id,
                variation_name=variation_name
            ).first()

            if not cart_item:
                return {"Error": "Cart item not found!"}, 404

            # Remove the cart item
            db.session.delete(cart_item)
            db.session.commit()

            # Check if the cart is now empty and handle cleanup if necessary
            remaining_items = CartItem.query.filter_by(cart_id=cart.id).count()
            if remaining_items == 0:
                db.session.delete(cart)
                db.session.commit()

            return {"Message": "Cart item removed successfully!"}, 200

        except SQLAlchemyError as e:
            db.session.rollback()
            return {"Error": f"Database error: {str(e)}"}, 500
        except Exception as e:
            return {"Error": f"Unexpected error: {str(e)}"}, 500


# Wishlist Management
class WishlistResource(Resource):
    @jwt_required()
    def get(self):
        try:
            current_user_id = get_jwt_identity()
            wishlist = WishList.query.filter_by(
                user_id=current_user_id).first()

            if not wishlist:
                # Create a new wishlist if none exists
                wishlist = WishList(user_id=current_user_id)
                db.session.add(wishlist)
                db.session.commit()
                return {"message": "Wishlist is empty!"}, 200

            # Use the relationship to get products
            wishlist_items = [{
                "id": product.id,
                "name": product.name,
                "image_url": product.image_urls[0] if product.image_urls else None,
                "price": product.price,
                "brand": product.brand.name if product.brand else "N/A",
                "category": product.category.name if product.category else "N/A"
            } for product in wishlist.products]

            return {"wishlist": wishlist_items}, 200

        except Exception as e:
            logger.error(
                f"Error fetching wishlist: {str(e)}\n{traceback.format_exc()}")
            return {"Error": "An error occurred while fetching wishlist"}, 500

    @jwt_required()
    def post(self):
        try:
            current_user_id = get_jwt_identity()
            data = request.get_json()

            if not data or 'product_id' not in data:
                return {"Error": "Product ID is required"}, 400

            # Validate product_id is an integer
            try:
                product_id = int(data['product_id'])
            except (TypeError, ValueError):
                return {"Error": "Invalid product ID format"}, 400

            # Check if product exists
            product = db.session.get(Product, product_id)
            if not product:
                return {"Error": "Product not found"}, 404

            # Get or create wishlist
            wishlist = WishList.query.filter_by(
                user_id=current_user_id).first()
            if not wishlist:
                wishlist = WishList(user_id=current_user_id)
                try:
                    db.session.add(wishlist)
                    db.session.commit()
                except SQLAlchemyError as e:
                    db.session.rollback()
                    return {"Error": "Failed to create wishlist"}, 500

            # Check if product is already in wishlist
            if product in wishlist.products:
                return {"Message": "Product already in wishlist"}, 201

            # Add product to wishlist
            try:
                wishlist.products.append(product)
                db.session.commit()
                return {"Message": "Product added to wishlist!"}, 200
            except SQLAlchemyError as e:
                db.session.rollback()
                return {"Error": "Failed to add product to wishlist"}, 500

        except Exception as e:
            logger.error(
                f"Unexpected error in wishlist post: {str(e)}\n{traceback.format_exc()}")
            return {"Error": "An unexpected error occurred"}, 500

    @jwt_required()
    def delete(self, product_id):
        try:
            current_user_id = get_jwt_identity()
            wishlist = WishList.query.filter_by(
                user_id=current_user_id).first()

            if not wishlist:
                return {"Error": "Wishlist not found"}, 404

            product = db.session.get(Product, product_id)
            if not product:
                return {"Error": "Product not found"}, 404

            if product not in wishlist.products:
                return {"Error": "Product not found in wishlist"}, 404

            try:
                wishlist.products.remove(product)
                db.session.commit()
                return {"Message": "Product removed from wishlist!"}, 200
            except SQLAlchemyError as e:
                logger.error(
                    f"Database error while removing from wishlist: {e}")
                db.session.rollback()
                return {"Error": "Failed to remove product from wishlist"}, 500

        except Exception as e:
            logger.error(f"Unexpected error in wishlist delete: {str(e)}")
            return {"Error": "An unexpected error occurred"}, 500


class CompareResource(Resource):
    @jwt_required()
    def get(self):
        try:
            current_user_id = get_jwt_identity()

            # Get or create compare list
            compare = Compare.query.filter_by(user_id=current_user_id).first()
            if not compare:
                return {"message": "Compare list is empty"}, 200

            # Delete items older than 24 hours
            twenty_four_hours_ago = datetime.now(
                timezone.utc) - timedelta(hours=24)
            old_items = CompareItem.query.filter(
                CompareItem.compare_id == compare.id,
                CompareItem.created_at <= twenty_four_hours_ago
            ).all()

            for item in old_items:
                db.session.delete(item)

            db.session.commit()

            # Get remaining valid items
            compare_items = CompareItem.query.filter_by(
                compare_id=compare.id).all()

            # Prepare response with product details
            items = []
            for item in compare_items:
                product = item.product
                product_data = {
                    "id": product.id,
                }
                items.append(product_data)

            return {"product_ids": items}, 200

        except Exception as e:
            logger.error(f"Error fetching compare list: {str(e)}")
            return {"error": "An error occurred while fetching compare list"}, 500

    @jwt_required()
    def post(self):
        try:
            current_user_id = get_jwt_identity()
            data = request.get_json()

            if not data or 'product_id' not in data:
                return {"error": "Product ID is required"}, 400

            # Get or create compare
            compare = Compare.query.filter_by(user_id=current_user_id).first()
            if not compare:
                compare = Compare(user_id=current_user_id)
                db.session.add(compare)
                db.session.commit()

            # Check if product exists
            product = db.session.get(Product, data['product_id'])
            if not product:
                return {"error": "Product not found"}, 404

            # Check if product is already in compare list
            existing_item = CompareItem.query.filter_by(
                compare_id=compare.id,
                product_id=data['product_id']
            ).first()

            if existing_item:
                return {"message": "Product already in compare list"}, 200

            # Check if compare list has reached limit of 3 items
            current_items_count = CompareItem.query.filter_by(
                compare_id=compare.id).count()
            if current_items_count >= 3:
                return {"error": "Compare list is full (max 3 items)"}, 400

            # Add new item to compare list
            compare_item = CompareItem(
                compare_id=compare.id,
                product_id=data['product_id']
            )

            db.session.add(compare_item)
            db.session.commit()

            return {"message": "Product added to compare list"}, 201

        except Exception as e:
            logger.error(f"Error adding to compare list: {str(e)}")
            db.session.rollback()
            return {"error": "An error occurred while adding to compare list"}, 500

    @jwt_required()
    def delete(self, product_id):
        try:
            current_user_id = get_jwt_identity()
            compare = Compare.query.filter_by(user_id=current_user_id).first()

            if not compare:
                return {"error": "Compare list not found"}, 404

            # Find and delete the compare item
            compare_item = CompareItem.query.filter_by(
                compare_id=compare.id,
                product_id=product_id
            ).first()

            if not compare_item:
                return {"error": "Product not found in compare list"}, 404

            db.session.delete(compare_item)
            db.session.commit()

            return {"message": "Product removed from compare list"}, 200

        except Exception as e:
            logger.error(f"Error removing from compare list: {str(e)}")
            db.session.rollback()
            return {"error": "An error occurred while removing from compare list"}, 500


# Order Management
class OrderResource(Resource):
    @jwt_required()
    def get(self):
        try:
            current_user_id = get_jwt_identity()

            user = db.session.get(User, current_user_id)
            if not user:
                logger.error(f"User {current_user_id} not found")
                return {"error": "User not found"}, 404

            orders = Order.query.filter_by(user_id=current_user_id).all()

            if not orders:
                logger.info(f"No orders found for user {current_user_id}")
                return {"orders": []}, 200

            try:
                order_list = []
                for order in orders:
                    try:
                        # Get address information
                        address_data = None
                        if order.address_id:
                            address = db.session.get(Address, order.address_id)
                            if address:
                                address_data = {
                                    "first_name": address.first_name,
                                    "last_name": address.last_name,
                                    "phone": address.phone,
                                    "street": address.street,
                                    "city": address.city,
                                    "additional_info": address.additional_info
                                }
                            else:
                                logger.error(
                                    f"Address {order.address_id} not found for order {order.id}")

                        # Get items for this specific order
                        items = []
                        for item in order.order_items:
                            product = db.session.get(Product, item.product_id)
                            if product:
                                # Get review for this product by this user
                                review = Review.query.filter_by(
                                    user_id=current_user_id,
                                    product_id=item.product_id
                                ).first()

                                review_data = None
                                if review:
                                    review_data = {
                                        "rating": review.rating,
                                        "comment": review.comment,
                                        "created_at": review.created_at.isoformat()
                                    }

                                item_data = {
                                    "product_id": item.product_id,
                                    "name": product.name,
                                    "image_url": product.image_urls[0] if product.image_urls and len(product.image_urls) > 0 else None,
                                    "quantity": item.quantity,
                                    "variation_name": item.variation_name,
                                    "price": float(item.variation_price) if item.variation_price is not None
                                    else float(product.price),
                                    "review": review_data
                                }
                                items.append(item_data)

                        # Build order data with address
                        order_data = {
                            "order_reference": order.order_reference,
                            "created_at": order.created_at.isoformat(),
                            "updated_at": order.updated_at.isoformat(),
                            "status": order.status,
                            "payment_method": order.payment.payment_method if order.payment else "Not specified",
                            "payment": order.payment.status if order.payment else "pending",
                            "failure_reason": order.payment.failure_reason if order.payment else None,
                            "checkout_request_id": order.payment.checkout_request_id if order.payment else None,
                            "items": items,
                            "total_amount": float(order.total_amount),
                            "address": address_data
                        }
                        order_list.append(order_data)
                    except Exception as e:
                        logger.error(
                            f"Error processing order {order.id}: {str(e)}")
                        continue

                return {"orders": order_list}, 200

            except Exception as e:
                logger.error(f"Error processing orders data: {str(e)}")
                return {"error": "Error processing orders data"}, 500

        except Exception as e:
            logger.error(
                f"Error fetching orders: {str(e)}\n{traceback.format_exc()}")
            return {"error": "An error occurred while fetching orders"}, 500

    @jwt_required()
    def post(self):
        try:
            current_user_id = get_jwt_identity()
            data = request.get_json()

            # Log incoming data
            logger.info(f"Creating order for user {current_user_id}")
            logger.debug(f"Order data: {data}")

            # Validate cart
            cart = Cart.query.filter_by(user_id=current_user_id).first()
            if not cart or not cart.items:
                logger.warning(f"Empty cart for user {current_user_id}")
                return {"error": "Cart is empty"}, 400

            try:
                # Create address
                address_data = data.get('address')
                if not address_data:
                    return {"error": "Address is required"}, 400

                address = Address(
                    user_id=current_user_id,
                    first_name=address_data['firstName'],
                    last_name=address_data['lastName'],
                    email=address_data['email'],
                    phone=address_data['phone'],
                    city=address_data['city'],
                    street=address_data['street'],
                    additional_info=address_data.get('additionalInfo')
                )
                db.session.add(address)
                db.session.flush()
                logger.debug(f"Address created with ID: {address.id}")

                # Generate order reference
                order_reference = Order.generate_order_reference()
                logger.debug(f"Generated order reference: {order_reference}")

                try:
                    # Create payment entry
                    payment = Payment(
                        order_reference=order_reference,
                        amount=data['total_amount'],
                        payment_method=data['payment_method'],
                        status='Pending'
                    )
                    db.session.add(payment)
                    db.session.flush()
                    logger.debug(f"Payment created with ID: {payment.id}")

                    # Create notification for the user
                    notification = Notification(
                        user_id=current_user_id,
                        message=f"Your order #{order.order_reference} has been placed successfully.",
                        is_read=False
                    )
                    db.session.add(notification)

                    # Create order
                    order = Order(
                        user_id=current_user_id,
                        order_reference=order_reference,
                        address_id=address.id,
                        payment_id=payment.id,
                        total_amount=data['total_amount'],
                        status='Order Placed'
                    )
                    db.session.add(order)
                    db.session.flush()
                    logger.debug(f"Order created with ID: {order.id}")

                    # Create order items
                    for cart_item in cart.items:
                        order_item = OrderItem(
                            order_id=order.id,
                            product_id=cart_item.product_id,
                            quantity=cart_item.quantity,
                            variation_name=cart_item.variation_name,
                            variation_price=cart_item.variation_price
                        )
                        db.session.add(order_item)

                    # Clear cart
                    for item in cart.items:
                        db.session.delete(item)
                    db.session.delete(cart)

                    db.session.commit()
                    logger.info(
                        f"Order {order_reference} created successfully")

                    try:
                        # Send order confirmation email
                        email_sent = send_order_confirmation(order)
                        if not email_sent:
                            logger.warning(
                                f"Failed to send confirmation email for order {order_reference}")
                    except Exception as e:
                        logger.error(
                            f"Email error for order {order_reference}: {str(e)}")
                        # Don't return error here, just log it

                    return {
                        "message": "Order placed successfully",
                        "order_reference": order.order_reference
                    }, 201

                except Exception as e:
                    logger.error(f"Error creating order/payment: {str(e)}")
                    raise

            except Exception as e:
                logger.error(f"Error creating address: {str(e)}")
                raise

        except Exception as e:
            db.session.rollback()
            logger.error(
                f"Order creation failed: {str(e)}\n{traceback.format_exc()}")
            return {"error": "Failed to create order"}, 500


class AdminOrderResource(Resource):
    @jwt_required()
    @admin_required
    def get(self):
        try:
            # Get all orders with eager loading of relationships
            orders = Order.query.options(
                db.joinedload(Order.payment),
                db.joinedload(Order.address),
                db.joinedload(Order.order_items).joinedload(OrderItem.product)
            ).all()

            if not orders:
                return {"message": "No orders found"}, 200

            order_list = []
            for order in orders:
                try:
                    # Get order items with null checks
                    items = []
                    for item in order.order_items:
                        if item.product:
                            item_data = {
                                "product_id": item.product_id,
                                "name": item.product.name,
                                "quantity": item.quantity,
                                "variation_name": item.variation_name,
                                "price": item.variation_price or item.product.price
                            }
                            items.append(item_data)

                    # Build order data with null checks
                    order_data = {
                        "id": order.id,
                        "order_reference": order.order_reference,
                        "user_id": order.user_id,
                        "total_amount": float(order.total_amount),
                        "status": order.status,
                        "created_at": order.created_at.isoformat(),
                        "payment_status": order.payment.status if order.payment else "Pending",
                        "payment_method": order.payment.payment_method if order.payment else "N/A",
                        "address": {
                            "first_name": order.address.first_name if order.address else None,
                            "last_name": order.address.last_name if order.address else None,
                            "email": order.address.email if order.address else None,
                            "phone": order.address.phone if order.address else None,
                            "city": order.address.city if order.address else None,
                            "street": order.address.street if order.address else None,
                            "additional_info": order.address.additional_info if order.address else None
                        } if order.address else None,
                        "items": items
                    }
                    order_list.append(order_data)

                except Exception as e:
                    logger.error(
                        f"Error processing order {order.id}: {str(e)}")
                    continue

            return {"orders": order_list}, 200

        except Exception as e:
            logger.error(f"Error fetching admin orders: {str(e)}")
            logger.error(f"Stack trace: {traceback.format_exc()}")
            return {"error": "An error occurred while fetching orders"}, 500


class AdminOrderDetailResource(Resource):
    @jwt_required()
    @admin_required
    def get(self, order_id):
        try:
            order = Order.query.options(
                db.joinedload(Order.payment),
                db.joinedload(Order.address),
                db.joinedload(Order.order_items).joinedload(OrderItem.product)
            ).get_or_404(order_id)

            order_details = {
                "order": {
                    # Order info
                    "id": order.id,
                    "order_reference": order.order_reference,
                    "status": order.status,
                    "total_amount": float(order.total_amount),
                    "created_at": order.created_at.isoformat(),
                    "updated_at": order.updated_at.isoformat(),


                    # User info
                    "user_id": order.user_id,
                    "username": order.user.username,
                    "email": order.user.email,
                    "phone_number": order.user.phone_number,

                    # Payment info
                    "payment_id": order.payment.id if order.payment else None,
                    "payment_status": order.payment.status if order.payment else "Pending",
                    "payment_method": order.payment.payment_method if order.payment else None,
                    "transaction_id": order.payment.transaction_id if order.payment else None,
                    "payment_date": order.payment.created_at.isoformat() if order.payment else None,


                    # Separate address object
                    "address": {
                        "first_name": order.address.first_name,
                        "last_name": order.address.last_name,
                        "email": order.address.email,
                        "phone": order.address.phone,
                        "city": order.address.city,
                        "street": order.address.street,
                        "additional_info": order.address.additional_info
                    } if order.address else None,

                    # Separate items array
                    "items": []
                },


            }

            # Process order items
            for item in order.order_items:
                product = item.product
                if product:
                    item_data = {
                        "id": item.id,
                        "product": {
                            "id": product.id,
                            "name": product.name,
                            "image_url": product.image_urls[0] if product.image_urls else None,
                            "brand": product.brand.name if product.brand else None,
                            "category": product.category.name if product.category else None
                        },
                        "quantity": item.quantity,
                        "unit_price": float(item.variation_price or product.price),
                        "total_price": float(item.variation_price or product.price) * item.quantity
                    }

                    # Add variation details if present
                    if item.variation_name:
                        item_data["variation"] = {
                            "name": item.variation_name,
                            "price": float(item.variation_price)
                        }

                    order_details["order"]["items"].append(item_data)

            return order_details, 200

        except Exception as e:
            logger.error(
                f"Error fetching admin order details: {str(e)}\n{traceback.format_exc()}")
            return {"error": "An error occurred while fetching order details"}, 500


class OrderStatusResource(Resource):
    @jwt_required()
    @admin_required
    def put(self, order_id):
        try:
            data = request.get_json()
            new_status = data.get('status')

            ORDER_STATUSES = ["Order Placed", "Packing",
                              "Shipped", "Out for Delivery", "Delivered"]

            if new_status not in ORDER_STATUSES:
                return {"error": "Invalid order status"}, 400

            order = Order.query.get_or_404(order_id)
            old_status = order.status
            order.status = new_status

            # Create notification for the user
            notification = Notification(
                user_id=order.user_id,
                message=f"Order status for Order #{order.order_reference} has been updated. Check your email for more details.",
                is_read=False
            )
            db.session.add(notification)

            # Update payment status if order is delivered
            if new_status == "Delivered":
                payment = order.payment
                if payment:
                    payment.status = "Success"
                    # Send payment success notification with invoice
                    send_payment_notification(payment)

                    # Create notification for the user
                    notification = Notification(
                        user_id=order.user_id,
                        message=f"Payment for Order #{order.order_reference} has been confirmed. Check your email for the receipt.",
                        is_read=False
                    )
                    db.session.add(notification)

                    if payment.status == "Failed":
                        # Create notification for payment failure
                        notification = Notification(
                            user_id=order.user_id,
                            message=f"Payment for Order #{order.order_reference} has failed. Please try again.",
                            is_read=False
                        )
                        db.session.add(notification)

            db.session.commit()

            # Send status update email
            send_shipment_update(order, old_status, new_status)

            return {"message": f"Order status updated to {new_status}"}, 200

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating order status: {str(e)}")
            return {"error": "Failed to update order status"}, 500


class PaymentResource(Resource):
    @jwt_required()
    def get(self, order_id, doc_type):
        try:
            # Validate document type
            if doc_type not in ['invoice', 'receipt']:
                return {"error": "Invalid document type"}, 400

            current_user_id = get_jwt_identity()
            order = Order.query.filter_by(order_reference=order_id).first()

            if not order:
                return {"error": "Order not found"}, 404

            # Check if the order belongs to the current user
            if str(order.user_id) != current_user_id:
                print(
                    f"DEBUG - JWT User ID: {current_user_id}, Type: {type(current_user_id)}")
                print(
                    f"DEBUG - Order User ID: {order.user_id}, Type: {type(order.user_id)}")
                return {"error": "Unauthorized access to this order"}, 403

            # Check if trying to access receipt for non-delivered order
            if doc_type == 'receipt' and order.status != 'Delivered':
                return {"error": "Receipt is only available for delivered orders"}, 400

            # Hard-coded company info since we don't have AppSettings
            company_name = "Phone Home Kenya"

            # Select template based on document type
            if doc_type == 'invoice':
                template = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Invoice for Order #{{ order.order_reference }}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            color: #333;
                            line-height: 1.5;
                            margin: 0;
                            padding: 20px;
                            background-color: #111;
                            color: #e4e4e4;
                        }
                        .document {
                            max-width: 800px;
                            margin: 0 auto;
                            padding: 30px;
                            background-color: #1a1a1a;
                            border: 1px solid #333;
                            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                        }
                        .header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 30px;
                            border-bottom: 2px solid #e81cff;
                            padding-bottom: 20px;
                        }
                        h1, h2, h3 {
                            color: #e81cff;
                            margin-top: 0;
                        }
                        .document-title {
                            font-size: 24px;
                            font-weight: bold;
                            text-transform: uppercase;
                        }
                        .info-section {
                            margin-bottom: 20px;
                        }
                        .info-grid {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 20px;
                        }
                        .info-box {
                            padding: 15px;
                            background-color: #222;
                            border-radius: 5px;
                        }
                        .info-box h3 {
                            margin-top: 0;
                            font-size: 16px;
                            color: #e81cff;
                            border-bottom: 1px solid #444;
                            padding-bottom: 5px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 20px 0;
                        }
                        th {
                            background-color: #333;
                            color: #e81cff;
                            text-align: left;
                            padding: 10px;
                        }
                        td {
                            padding: 10px;
                            border-bottom: 1px solid #444;
                        }
                        .totals {
                            margin-top: 20px;
                            text-align: right;
                        }
                        .total-row {
                            font-weight: bold;
                            font-size: 18px;
                            color: #e81cff;
                        }
                        .footer {
                            margin-top: 30px;
                            text-align: center;
                            font-size: 12px;
                            color: #888;
                            border-top: 1px solid #444;
                            padding-top: 20px;
                        }
                        .company-name {
                            font-size: 24px;
                            font-weight: bold;
                            color: #e81cff;
                        }
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
                                <p><strong>Name:</strong> {{ order.address.first_name }} {{ order.address.last_name if order.address.last_name else "" }}</p>
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
                                    <td>{{ "%.2f"|format(item.variation_price or item.product.price) }}</td>
                                    <td>{{ "%.2f"|format((item.variation_price or item.product.price) * item.quantity) }}</td>
                                </tr>
                                {% endfor %}
                            </tbody>
                        </table>
                        
                        <div class="totals">
                            <p><strong>Subtotal:</strong> {{ "%.2f"|format(order.total_amount) }}</p>
                            <p><strong>Shipping:</strong> {{ "%.2f"|format(order.shipping_cost) if order.shipping_cost else "0.00" }}</p>
                            <p class="total-row">TOTAL: {{ "%.2f"|format(order.total_amount + (order.shipping_cost or 0)) }}</p>
                        </div>
                        
                        <div class="footer">
                            <p>Thank you for your order! This is not a receipt.</p>
                            <p>For questions, please contact customer support.</p>
                            <p>© {{ now.year }} {{ company_name }}. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """
            else:  # receipt template
                template = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Receipt for Order #{{ order.order_reference }}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            color: #333;
                            line-height: 1.5;
                            margin: 0;
                            padding: 20px;
                            background-color: #111;
                            color: #e4e4e4;
                        }
                        .document {
                            max-width: 800px;
                            margin: 0 auto;
                            padding: 30px;
                            background-color: #1a1a1a;
                            border: 1px solid #333;
                            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                        }
                        .header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 30px;
                            border-bottom: 2px solid #4caf50;
                            padding-bottom: 20px;
                        }
                        h1, h2, h3 {
                            color: #4caf50;
                            margin-top: 0;
                        }
                        .document-title {
                            font-size: 24px;
                            font-weight: bold;
                            text-transform: uppercase;
                        }
                        .company-name {
                            font-size: 24px;
                            font-weight: bold;
                            color: #4caf50;
                        }
                        .paid-stamp {
                            position: absolute;
                            top: 100px;
                            right: 100px;
                            font-size: 40px;
                            color: #4caf50;
                            border: 5px solid #4caf50;
                            padding: 10px 20px;
                            transform: rotate(-15deg);
                            opacity: 0.7;
                        }
                        .info-section {
                            margin-bottom: 20px;
                        }
                        .info-grid {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 20px;
                        }
                        .info-box {
                            padding: 15px;
                            background-color: #222;
                            border-radius: 5px;
                        }
                        .info-box h3 {
                            margin-top: 0;
                            font-size: 16px;
                            color: #4caf50;
                            border-bottom: 1px solid #444;
                            padding-bottom: 5px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 20px 0;
                        }
                        th {
                            background-color: #333;
                            color: #4caf50;
                            text-align: left;
                            padding: 10px;
                        }
                        td {
                            padding: 10px;
                            border-bottom: 1px solid #444;
                        }
                        .totals {
                            margin-top: 20px;
                            text-align: right;
                        }
                        .total-row {
                            font-weight: bold;
                            font-size: 18px;
                            color: #4caf50;
                        }
                        .footer {
                            margin-top: 30px;
                            text-align: center;
                            font-size: 12px;
                            color: #888;
                            border-top: 1px solid #444;
                            padding-top: 20px;
                        }
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
                                <p><strong>Delivery Date:</strong> {{ order.delivered_at.strftime('%B %d, %Y') if order.delivered_at else "N/A" }}</p>
                            </div>
                            
                            <div class="info-box">
                                <h3>CUSTOMER DETAILS</h3>
                                <p><strong>Name:</strong> {{ order.address.first_name }} {{ order.address.last_name if order.address.last_name else "" }}</p>
                                <p><strong>Phone:</strong> {{ order.address.phone }}</p>
                                <p><strong>Address:</strong> {{ order.address.street }}, {{ order.address.city }}</p>
                                {% if order.address.additional_info %}
                                <p><strong>Additional:</strong> {{ order.address.additional_info }}</p>
                                {% endif %}
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
                                    <td>{{ "%.2f"|format(item.variation_price or item.product.price) }}</td>
                                    <td>{{ "%.2f"|format((item.variation_price or item.product.price) * item.quantity) }}</td>
                                </tr>
                                {% endfor %}
                            </tbody>
                        </table>
                        
                        <div class="totals">
                            <p><strong>Subtotal:</strong> {{ "%.2f"|format(order.total_amount) }}</p>
                            <p><strong>Shipping:</strong> {{ "%.2f"|format(order.shipping_cost) if order.shipping_cost else "0.00" }}</p>
                            <p class="total-row">TOTAL PAID: {{ "%.2f"|format(order.total_amount + (order.shipping_cost or 0)) }}</p>
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

            # Get current date for copyright year
            now = datetime.now()

            # Render the template with context
            doc_content = render_template_string(
                template,
                order=order,
                company_name=company_name,
                now=now
            )

            # Generate PDF
            pdf = BytesIO()
            pisa_status = pisa.CreatePDF(
                BytesIO(doc_content.encode("utf-8")), pdf)

            if pisa_status.err:
                logger.error(f"PDF generation error: {pisa_status.err}")
                return {"error": "Failed to generate PDF document"}, 500

            pdf.seek(0)

            # Send the PDF file
            return send_file(
                pdf,
                mimetype='application/pdf',
                as_attachment=True,
                download_name=f'{doc_type}_{order.order_reference}.pdf'
            )

        except Exception as e:
            logger.error(
                f"Error generating {doc_type}: {str(e)}\n{traceback.format_exc()}")
            return {"error": f"Failed to generate {doc_type}: {str(e)}"}, 500


class MpesaPaymentResource(Resource):
    @jwt_required()
    def post(self):
        """Initiate M-Pesa STK Push payment and create order on success"""
        try:
            current_user_id = get_jwt_identity()
            data = request.get_json()

            # Log incoming data
            logger.info(f"Creating M-Pesa payment for user {current_user_id}")
            logger.debug(f"Payment data: {data}")

            # Validate required fields
            required_fields = ['phone_number', 'total_amount', 'address']
            for field in required_fields:
                if not data.get(field):
                    return {"error": f"{field} is required"}, 400

            # Validate cart exists and has items
            cart = Cart.query.filter_by(user_id=current_user_id).first()
            if not cart or not cart.items:
                logger.warning(f"Empty cart for user {current_user_id}")
                return {"error": "Cart is empty"}, 400

            phone_number = data['phone_number']
            amount = float(data['total_amount'])

            # Validate amount
            if amount <= 0:
                return {"error": "Amount must be greater than 0"}, 400

            # Generate order reference for STK push
            order_reference = Order.generate_order_reference()
            logger.debug(f"Generated order reference: {order_reference}")

            # Initiate STK Push first (before creating order)
            result = mpesa_service.initiate_stk_push(
                phone_number=phone_number,
                amount=amount,
                order_reference=order_reference
            )

            if not result["success"]:
                logger.error(f"STK Push failed: {result.get('error')}")
                return {"error": result["error"]}, 400

            # STK Push successful - now create order and payment records
            try:
                # Create address
                address_data = data.get('address')
                address = Address(
                    user_id=current_user_id,
                    first_name=address_data['firstName'],
                    last_name=address_data['lastName'],
                    email=address_data['email'],
                    phone=address_data['phone'],
                    city=address_data['city'],
                    street=address_data['street'],
                    additional_info=address_data.get('additionalInfo')
                )
                db.session.add(address)
                db.session.flush()
                logger.debug(f"Address created with ID: {address.id}")

                # Create payment record with STK push details
                payment = Payment(
                    order_reference=order_reference,
                    amount=amount,
                    payment_method="MPESA",
                    status="Pending",
                    phone_number=phone_number,
                    checkout_request_id=result["checkout_request_id"],
                    merchant_request_id=result["merchant_request_id"]
                )
                db.session.add(payment)
                db.session.flush()
                logger.debug(f"Payment created with ID: {payment.id}")

                # Create order
                order = Order(
                    user_id=current_user_id,
                    order_reference=order_reference,
                    address_id=address.id,
                    payment_id=payment.id,
                    total_amount=amount,
                    status='Pending Payment'  # Different status since payment is pending
                )
                db.session.add(order)
                db.session.flush()
                logger.debug(f"Order created with ID: {order.id}")

                # Create order items
                for cart_item in cart.items:
                    order_item = OrderItem(
                        order_id=order.id,
                        product_id=cart_item.product_id,
                        quantity=cart_item.quantity,
                        variation_name=cart_item.variation_name,
                        variation_price=cart_item.variation_price
                    )
                    db.session.add(order_item)

                # Create initial notification
                notification = Notification(
                    user_id=current_user_id,
                    message=f"Order #{order.order_reference} created. Please complete M-Pesa payment on your phone.",
                    is_read=False
                )
                db.session.add(notification)

                # Clear cart only after successful order creation
                for item in cart.items:
                    db.session.delete(item)
                db.session.delete(cart)

                db.session.commit()
                logger.info(
                    f"Order {order_reference} created successfully with pending payment")

                return {
                    "success": True,
                    "message": "Order created successfully. Please check your phone for M-Pesa prompt.",
                    "order_reference": order.order_reference,
                    "checkout_request_id": result["checkout_request_id"]
                }, 201

            except Exception as e:
                db.session.rollback()
                logger.error(
                    f"Error creating order after successful STK push: {str(e)}")
                return {"error": "STK push successful but order creation failed. Please contact support."}, 500

        except Exception as e:
            logger.error(f"M-Pesa payment initiation failed: {str(e)}")
            return {"error": "Payment initiation failed"}, 500


class MpesaCallbackResource(Resource):
    def post(self):
        """Handle M-Pesa callback"""
        try:
            callback_data = request.get_json()
            logger.info(f"M-Pesa Callback received: {callback_data}")

            # Extract callback data
            stk_callback = callback_data.get("Body", {}).get("stkCallback", {})

            merchant_request_id = stk_callback.get("MerchantRequestID")
            checkout_request_id = stk_callback.get("CheckoutRequestID")
            result_code = stk_callback.get("ResultCode")
            result_desc = stk_callback.get("ResultDesc")

            if not checkout_request_id:
                logger.error("No CheckoutRequestID in callback")
                return {"ResultCode": 1, "ResultDesc": "Invalid callback data"}

            # Find payment record
            payment = Payment.query.filter_by(
                checkout_request_id=checkout_request_id).first()
            if not payment:
                logger.error(
                    f"Payment not found for CheckoutRequestID: {checkout_request_id}")
                return {"ResultCode": 1, "ResultDesc": "Payment record not found"}

            # Find associated order
            order = Order.query.filter_by(
                order_reference=payment.order_reference).first()
            if not order:
                logger.error(
                    f"Order not found for reference: {payment.order_reference}")
                return {"ResultCode": 1, "ResultDesc": "Order not found"}

            # Update payment record
            payment.result_code = str(result_code)
            payment.result_desc = result_desc

            if result_code == 0:  # Success
                # Extract transaction details from callback metadata
                callback_metadata = stk_callback.get(
                    "CallbackMetadata", {}).get("Item", [])

                transaction_id = None
                mpesa_receipt = None
                phone_number = None

                for item in callback_metadata:
                    name = item.get("Name")
                    value = item.get("Value")

                    if name == "MpesaReceiptNumber":
                        mpesa_receipt = value
                        transaction_id = value  # Use receipt as transaction ID
                    elif name == "PhoneNumber":
                        phone_number = str(value)

                # Update payment with success details
                payment.status = "Success"
                payment.transaction_id = transaction_id
                payment.mpesa_receipt = mpesa_receipt
                if phone_number:
                    payment.phone_number = phone_number
                payment.failure_reason = None  # Clear any previous failure reason

                # Update order status to paid and confirmed
                order.status = "Order Placed"

                # Create success notification
                notification = Notification(
                    user_id=order.user_id,
                    message=f"Payment successful for order #{order.order_reference}. M-Pesa Receipt: {mpesa_receipt}. Your order is being processed.",
                    is_read=False
                )
                db.session.add(notification)

                logger.info(
                    f"Payment successful for order {payment.order_reference}")

                try:
                    # Send order confirmation email after successful payment
                    email_sent = send_order_confirmation(order)
                    if not email_sent:
                        logger.warning(
                            f"Failed to send confirmation email for order {order.order_reference}")
                except Exception as e:
                    logger.error(
                        f"Email error for order {order.order_reference}: {str(e)}")
                    # Don't fail the callback for email issues

            else:  # Payment Failed
                payment.status = "Failed"
                payment.failure_reason = result_desc

                # Update order status to payment failed
                order.status = "Payment Failed"

                # Create failure notification
                notification = Notification(
                    user_id=order.user_id,
                    message=f"Payment failed for order #{order.order_reference}. Reason: {result_desc}. Please try again or contact support.",
                    is_read=False
                )
                db.session.add(notification)

                logger.warning(
                    f"Payment failed for order {payment.order_reference}: {result_desc}")

            db.session.commit()

            # Return success response to Safaricom
            return {"ResultCode": 0, "ResultDesc": "Callback processed successfully"}

        except Exception as e:
            logger.error(f"M-Pesa callback processing failed: {str(e)}")
            db.session.rollback()  # Rollback any partial changes
            return {"ResultCode": 1, "ResultDesc": "Callback processing failed"}


class MpesaPaymentRetryResource(Resource):
    @jwt_required()
    def post(self):
        """Retry M-Pesa STK Push payment for an existing order"""
        try:
            current_user_id = get_jwt_identity()
            data = request.get_json()

            # Log incoming data
            logger.info(f"Retrying M-Pesa payment for user {current_user_id}")
            logger.debug(f"Retry payment data: {data}")

            # Validate required fields for retry
            required_fields = ['phone_number', 'order_reference']
            for field in required_fields:
                if not data.get(field):
                    return {"error": f"{field} is required"}, 400

            order_reference = data['order_reference']
            phone_number = data['phone_number']

            # Find existing order and verify ownership
            order = Order.query.filter_by(
                order_reference=order_reference).first()
            if not order:
                logger.warning(f"Order {order_reference} not found for retry")
                return {"error": "Order not found"}, 404

            if str(order.user_id) != current_user_id:
                logger.warning(
                    f"Unauthorized retry attempt for order {order_reference} by user {current_user_id}")
                return {"error": "Unauthorized access to order"}, 403

            # Check if order can be retried (should be in failed payment state)
            if order.status not in ['Pending Payment', 'Payment Failed']:
                logger.warning(
                    f"Cannot retry payment for order {order_reference} with status {order.status}")
                return {"error": "Order payment cannot be retried"}, 400

            # Get existing payment record
            payment = order.payment
            if not payment:
                logger.error(
                    f"No payment record found for order {order_reference}")
                return {"error": "No payment record found"}, 404

            amount = payment.amount

            # Validate amount
            if amount <= 0:
                return {"error": "Invalid payment amount"}, 400

            # Initiate new STK Push
            result = mpesa_service.initiate_stk_push(
                phone_number=phone_number,
                amount=amount,
                order_reference=order_reference
            )

            if not result["success"]:
                logger.error(f"STK Push retry failed: {result.get('error')}")
                return {"error": result["error"]}, 400

            # Update existing payment record with new STK push details
            try:
                payment.phone_number = phone_number
                payment.status = "Pending"
                payment.checkout_request_id = result["checkout_request_id"]
                payment.merchant_request_id = result["merchant_request_id"]
                payment.updated_at = datetime.now(timezone.utc)

                # Update order status back to pending payment
                order.status = 'Pending Payment'
                order.updated_at = datetime.now(timezone.utc)

                # Create retry notification
                notification = Notification(
                    user_id=current_user_id,
                    message=f"Payment retry initiated for order #{order.order_reference}. Please complete M-Pesa payment on your phone.",
                    is_read=False
                )
                db.session.add(notification)

                db.session.commit()
                logger.info(
                    f"Payment retry initiated successfully for order {order_reference}")

                return {
                    "success": True,
                    "message": "Payment retry initiated successfully. Please check your phone for M-Pesa prompt.",
                    "order_reference": order.order_reference,
                    "checkout_request_id": result["checkout_request_id"]
                }, 200

            except Exception as e:
                db.session.rollback()
                logger.error(
                    f"Error updating payment record for retry: {str(e)}")
                return {"error": "STK push successful but payment update failed. Please contact support."}, 500

        except Exception as e:
            logger.error(f"M-Pesa payment retry failed: {str(e)}")
            return {"error": "Payment retry failed"}, 500


class PaymentStatusResource(Resource):
    @jwt_required()
    def get(self, order_reference):
        """Check payment status for an order"""
        try:
            current_user_id = get_jwt_identity()

            # Find order and verify ownership
            order = Order.query.filter_by(
                order_reference=order_reference).first()
            if not order:
                return {"error": "Order not found"}, 404

            if str(order.user_id) != current_user_id:
                return {"error": "Unauthorized access"}, 403

            payment = order.payment
            if not payment:
                return {"error": "No payment record found"}, 404

            return {
                "order_reference": order_reference,
                "payment_method": payment.payment_method,
                "payment_status": payment.status,
                "amount": float(payment.amount),
                "phone_number": payment.phone_number,
                "transaction_id": payment.transaction_id,
                "mpesa_receipt": payment.mpesa_receipt,
                "failure_reason": payment.failure_reason,
                "created_at": payment.created_at.isoformat(),
                "updated_at": payment.updated_at.isoformat()
            }, 200

        except Exception as e:
            logger.error(f"Error fetching payment status: {str(e)}")
            return {"error": "Failed to fetch payment status"}, 500

# Review Management


class ReviewResource(Resource):
    @jwt_required()
    def get(self, product_id):
        reviews = Review.query.filter_by(product_id=product_id).all()
        if not reviews:
            return {"Message": "No reviews found for this product."}, 404
        review_list = [
            {
                "user": review.user.username,
                "rating": review.rating,
                "comment": review.comment,
                "timestamp": review.created_at.isoformat()
            } for review in reviews
        ]
        return {"reviews": review_list}, 200

    @jwt_required()
    def post(self, product_id):
        try:
            current_user_id = get_jwt_identity()
            data = request.get_json()
            rating = data.get('rating')
            comment = data.get('comment')

            product = Product.query.get_or_404(product_id)

            # Check if user already reviewed the product
            existing_review = Review.query.filter_by(
                user_id=current_user_id, product_id=product.id).first()
            if existing_review:
                return {"Error": "You have already reviewed this product."}, 400

            # Create new review
            new_review = Review(
                user_id=current_user_id,
                product_id=product.id,
                rating=rating,
                comment=comment
            )
            db.session.add(new_review)

            # Create notification for the user
            notification = Notification(
                user_id=current_user_id,
                message=f"Thank you for reviewing {product.name}! Your feedback helps other customers make informed decisions.",
                is_read=False
            )
            db.session.add(notification)

            db.session.commit()
            return {"Message": "Review added successfully!"}, 201

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error adding review: {str(e)}")
            return {"Error": "An error occurred while adding the review"}, 500

    @jwt_required()
    def delete(self, product_id):
        current_user_id = get_jwt_identity()
        review = Review.query.filter_by(
            user_id=current_user_id, product_id=product_id).first_or_404()

        db.session.delete(review)
        db.session.commit()
        return {"Message": "Review deleted!"}, 200

# Notifications


class NotificationResource(Resource):
    @jwt_required()
    def get(self):
        current_user_id = get_jwt_identity()
        notifications = Notification.query.filter_by(
            user_id=current_user_id).all()

        if not notifications:
            return {"Message": "No notifications found!"}, 404

        notification_list = [
            {
                "message": notification.message,
                "created_at": notification.created_at.isoformat(),
                "is_read": notification.is_read
            } for notification in notifications
        ]
        return {"notifications": notification_list}, 200

    @jwt_required()
    def put(self, notification_id):
        current_user_id = get_jwt_identity()
        notification = Notification.query.filter_by(
            id=notification_id, user_id=current_user_id).first_or_404()

        notification.is_read = True
        db.session.commit()

        return {"Message": "Notification marked as read."}, 200

# Admin Notifications Management


class AdminNotificationResource(Resource):
    @jwt_required()
    @admin_required  # Only admins can send notifications
    def post(self):
        data = request.get_json()
        message = data.get('message')
        user_id = data.get('user_id')

        user = User.query.get_or_404(user_id)

        new_notification = Notification(
            message=message,
            user_id=user.id
        )
        db.session.add(new_notification)
        db.session.commit()

        return {"Message": "Notification sent to user!"}, 201

# Admin Management Resource for managing Users


class AdminUserManagement(Resource):
    @jwt_required()
    @admin_required
    def get(self):
        users = User.query.all()
        user_list = [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "phone_number": user.phone_number,
                "address": user.address,
                "is_admin": user.role == "admin"  # Add this to show admin status
            }
            for user in users
        ]
        return {"users": user_list}, 200

    @jwt_required()
    @admin_required
    def patch(self, user_id):
        try:
            # Get the user
            user = User.query.get_or_404(user_id)
            data = request.get_json()

            # Check if is_admin is in the request data
            if 'is_admin' not in data:
                return {"error": "is_admin field is required"}, 400

            # Update the role based on is_admin value
            new_role = "admin" if data['is_admin'] else "user"
            old_role = user.role
            user.role = new_role

            # Create an audit log for this action
            current_admin_id = get_jwt_identity()
            audit_log = AuditLog(
                admin_id=current_admin_id,
                action=f"Changed user {user.username} (ID: {user.id}) role from {old_role} to {new_role}"
            )
            db.session.add(audit_log)

            # Create notification for the user
            notification = Notification(
                user_id=user.id,
                message=f"Your account role has been changed to {new_role}.",
                is_read=False
            )
            db.session.add(notification)

            db.session.commit()

            # sync with admins table
            if new_role == "admin":
                sync_admin_users()

            return {
                "message": f"User role updated successfully to {new_role}",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "is_admin": user.role == "admin"
                }
            }, 200

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating user role: {str(e)}")
            return {"error": "An error occurred while updating user role"}, 500

    @jwt_required()
    @admin_required
    def delete(self, user_id):
        try:
            # Start a transaction
            user = User.query.get_or_404(user_id)

            # Store user info for logging
            user_info = {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }

            try:
                # Create audit log
                current_admin_id = get_jwt_identity()
                audit_log = AuditLog(
                    admin_id=current_admin_id,
                    action=f"Deleted user {user.username} (ID: {user.id})"
                )
                db.session.add(audit_log)

                # Delete related records in the correct order (respecting foreign key constraints)

                # 1. First delete cart items
                cart = Cart.query.filter_by(user_id=user.id).first()
                if cart:
                    CartItem.query.filter_by(cart_id=cart.id).delete()
                    db.session.delete(cart)

                # 2. Delete other related records
                WishList.query.filter_by(user_id=user.id).delete()
                Compare.query.filter_by(user_id=user.id).delete()
                Notification.query.filter_by(user_id=user.id).delete()
                Review.query.filter_by(user_id=user.id).delete()
                Address.query.filter_by(user_id=user.id).delete()

                # 3. Update orders instead of deleting them
                Order.query.filter_by(user_id=user.id).update(
                    {Order.user_id: None})

                # 4. Finally delete the user
                db.session.delete(user)
                db.session.commit()

                # Log successful deletion
                logger.info(f"User successfully deleted: {user_info}")
                return {"message": "User deleted successfully!", "user": user_info}, 200

            except SQLAlchemyError as e:
                db.session.rollback()
                logger.error(
                    f"Database error while deleting user {user_id}: {str(e)}\n{traceback.format_exc()}")
                return {"error": "Database error occurred while deleting user"}, 500

        except SQLAlchemyError as e:
            logger.error(
                f"Database error while fetching user {user_id}: {str(e)}\n{traceback.format_exc()}")
            return {"error": "User not found or database error"}, 404

        except Exception as e:
            logger.error(
                f"Unexpected error while deleting user {user_id}: {str(e)}\n{traceback.format_exc()}")
            return {"error": "An unexpected error occurred while deleting user"}, 500


class AdminLogin(Resource):
    def post(self):
        try:
            data = request.get_json()
            email = data.get('email')
            password = data.get('password')

            admin = Admin.query.filter_by(email=email).first()

            if admin and check_password_hash(admin.password_hash, password):
                # Create token with 2 hour expiration
                access_token = create_access_token(
                    identity=str(admin.id),
                    expires_delta=timedelta(hours=2)
                )
                return {
                    "message": "Login successful",
                    "access_token": access_token,
                    "user": {
                        "id": admin.id,
                        "name": admin.username,
                        "email": admin.email,
                        "role": "admin"
                    }
                }, 200
            else:
                return {"error": "Invalid credentials!"}, 401

        except Exception as e:
            logger.error(
                f"Admin login error: {str(e)}\n{traceback.format_exc()}")
            return {"error": "An error occurred during login"}, 500

# Audit Logs Resource (Admin-only)


class AuditLogResource(Resource):
    @jwt_required()
    @admin_required
    def get(self):
        logs = AuditLog.query.all()
        log_list = [
            {
                "admin": log.admin.username,
                "action": log.action,
                "created_at": log.created_at.isoformat()
            } for log in logs
        ]
        return {"audit_logs": log_list}, 200

    @jwt_required()
    @admin_required
    def post(self):
        data = request.get_json()
        action = data.get('action')
        current_admin_id = get_jwt_identity()

        new_log = AuditLog(
            admin_id=current_admin_id,
            action=action
        )
        db.session.add(new_log)
        db.session.commit()

        return {"Message": "Audit log added!"}, 201


class CategoryResource(Resource):
    def get(self):
        # Fetch all categories
        categories = Category.query.all()
        category_list = [{"id": category.id, "name": category.name}
                         for category in categories]
        return {"categories": category_list}, 200

    def post(self):

        # Create a new category
        data = request.get_json()
        name = data.get('name')

        if not name:
            return {"Error": "Category name is required"}, 400

        category = Category(name=name)
        db.session.add(category)
        db.session.commit()
        return {"Message": "Category created successfully!"}, 201

    def put(self, category_id):
        # Update an existing category
        data = request.get_json()
        category = Category.query.get_or_404(category_id)
        name = data.get('name')

        if not name:
            return {"Error": "Category name is required"}, 400

        category.name = name
        db.session.commit()
        return {"Message": "Category updated successfully!"}, 200

    def delete(self, category_id):
        # Delete a category
        category = Category.query.get_or_404(category_id)
        db.session.delete(category)
        db.session.commit()
        return {"Message": "Category deleted successfully!"}, 200

    def get(self, category_id=None):
        try:
            if category_id:
                # Get specific category
                category = Category.query.get_or_404(category_id)
                return {
                    "id": category.id,
                    "name": category.name,
                    "brands": [{
                        "id": brand.id,
                        "name": brand.name
                    } for brand in category.brands]
                }, 200
            else:
                # Get all categories
                categories = Category.query.all()
                return {
                    "categories": [{
                        "id": category.id,
                        "name": category.name,
                        "brands": [{
                            "id": brand.id,
                            "name": brand.name
                        } for brand in category.brands]
                    } for category in categories]
                }, 200
        except Exception as e:
            logger.error(f"Error fetching categories: {e}")
            return {"Error": "An error occurred while fetching categories"}, 500


class BrandResource(Resource):
    def get(self):
        # Get category_id from query parameters
        category_id = request.args.get('category')

        try:
            if category_id:
                # If category_id is provided, filter brands by category
                category = Category.query.get_or_404(category_id)
                brands = category.brands.all()
            else:
                # If no category_id, return all brands
                brands = Brand.query.all()

            # Format response to include all categories for each brand
            brand_list = []
            for brand in brands:
                brand_data = {
                    "id": brand.id,
                    "name": brand.name,
                    "categories": [
                        {
                            "id": category.id,
                            "name": category.name
                        } for category in brand.categories
                    ]
                }
                brand_list.append(brand_data)

            return brand_list, 200

        except Exception as e:
            logger.error(f"Error fetching brands: {e}")
            return {"Error": "An error occurred while fetching brands"}, 500

    def post(self):
        try:
            data = request.get_json()

            if not data.get('name'):
                return {"Error": "Brand name is required"}, 400

            if not data.get('category_ids') or not isinstance(data.get('category_ids'), list):
                return {"Error": "At least one category_id is required as a list"}, 400

            # Check if brand already exists
            existing_brand = Brand.query.filter_by(name=data['name']).first()
            if existing_brand:
                return {"Error": "Brand with this name already exists"}, 400

            # Verify all categories exist
            category_ids = data['category_ids']
            categories = Category.query.filter(
                Category.id.in_(category_ids)).all()

            if len(categories) != len(category_ids):
                return {"Error": "One or more category IDs are invalid"}, 400

            # Create new brand
            new_brand = Brand(name=data['name'])

            # Add categories to the brand
            for category in categories:
                new_brand.categories.append(category)

            db.session.add(new_brand)
            db.session.commit()

            return {
                "Message": "Brand Created Successfully!",
                "brand": {
                    "id": new_brand.id,
                    "name": new_brand.name,
                    "categories": [
                        {
                            "id": category.id,
                            "name": category.name
                        } for category in new_brand.categories
                    ]
                }
            }, 201

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating brand: {e}")
            return {"Error": "An error occurred while creating the brand"}, 500


class BrandDetailResource(Resource):
    def get(self, brand_id):
        try:
            brand = Brand.query.get_or_404(brand_id)
            return {
                "id": brand.id,
                "name": brand.name,
                "categories": [
                    {
                        "id": category.id,
                        "name": category.name
                    } for category in brand.categories
                ]
            }, 200
        except Exception as e:
            logger.error(f"Error fetching brand {brand_id}: {e}")
            return {"Error": "Brand not found"}, 404

    def put(self, brand_id):
        try:
            brand = Brand.query.get_or_404(brand_id)
            data = request.get_json()

            # Update brand name if provided
            if data.get('name'):
                # Check if another brand has this name
                existing_brand = Brand.query.filter(
                    Brand.name == data['name'],
                    Brand.id != brand_id
                ).first()
                if existing_brand:
                    return {"Error": "Brand with this name already exists"}, 400
                brand.name = data['name']

            # Update categories if provided
            if data.get('category_ids') is not None:
                if not isinstance(data.get('category_ids'), list):
                    return {"Error": "category_ids must be a list"}, 400

                # Clear existing categories
                brand.categories.clear()

                # Add new categories
                if data['category_ids']:  # Only if list is not empty
                    categories = Category.query.filter(
                        Category.id.in_(data['category_ids'])).all()
                    if len(categories) != len(data['category_ids']):
                        return {"Error": "One or more category IDs are invalid"}, 400

                    for category in categories:
                        brand.categories.append(category)

            db.session.commit()

            return {
                "Message": "Brand updated successfully!",
                "brand": {
                    "id": brand.id,
                    "name": brand.name,
                    "categories": [
                        {
                            "id": category.id,
                            "name": category.name
                        } for category in brand.categories
                    ]
                }
            }, 200

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating brand {brand_id}: {e}")
            return {"Error": "An error occurred while updating the brand"}, 500

    def delete(self, brand_id):
        try:
            brand = Brand.query.get_or_404(brand_id)

            # Check if brand has associated products
            products_count = Product.query.filter_by(brand_id=brand_id).count()
            if products_count > 0:
                return {
                    "Error": f"Cannot delete brand '{brand.name}' because it has {products_count} associated products"
                }, 400

            # Clear category associations using the association table directly
            brand_category_table = Brand.categories.property.secondary
            db.session.execute(
                brand_category_table.delete().where(
                    brand_category_table.c.brand_id == brand_id
                )
            )

            # Delete the brand
            db.session.delete(brand)
            db.session.commit()

            return {"Message": f"Brand '{brand.name}' deleted successfully!"}, 200

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error deleting brand {brand_id}: {str(e)}")
            return {"Error": "An error occurred while deleting the brand"}, 500


# Error Handling
@app.errorhandler(404)
def resource_not_found(e):
    return {"Error": "Resource not found!"}, 404


@app.errorhandler(500)
def internal_server_error(e):
    return {"Error": "An internal server error occurred!"}, 500


@app.errorhandler(Exception)
def handle_exception(e):
    return {"Error": "An unexpected error occurred."}, 500


# Register all the resources with Flask-Restful
api.add_resource(SignUp, '/signup')
api.add_resource(Login, '/login')
api.add_resource(Logout, '/logout')
api.add_resource(ForgotPasswordResource, '/forgot-password')
api.add_resource(ResetPasswordResource, '/reset-password/<token>')

# Profile routes
profile_view = ProfileView.as_view('profile_view')
app.add_url_rule('/api/profile', view_func=profile_view,
                 methods=['GET', 'PUT'])
app.add_url_rule('/api/profile/stats',
                 view_func=ProfileStatsView.as_view('profile_stats'))
app.add_url_rule('/api/profile/orders',
                 view_func=ProfileOrdersView.as_view('profile_orders'))
app.add_url_rule('/api/profile/wishlist',
                 view_func=ProfileWishlistView.as_view('profile_wishlist'))

# Product routes
api.add_resource(ProductResource, '/products')
api.add_resource(GetProductsByType, '/products/<string:product_type>')
api.add_resource(GetProductsByCategory, '/products/category/<int:category_id>')
api.add_resource(GetProductById, '/product/<int:product_id>')
api.add_resource(DeleteProductById, '/product/<int:product_id>')
api.add_resource(ProductVariationResource,
                 '/products/<int:product_id>/variations')
api.add_resource(ProductUpdateResource, '/products/<int:product_id>')

# brand routes
api.add_resource(BrandResource, '/brands')
api.add_resource(BrandDetailResource, '/brands/<int:brand_id>')

# category route
api.add_resource(CategoryResource, '/categories',
                 '/categories/<int:category_id>')

# Cart routes
api.add_resource(CartResource, '/cart')

# Wishlist routes
api.add_resource(WishlistResource, '/wishlist', '/wishlist/<int:product_id>')

# compare route
api.add_resource(CompareResource, '/compare', '/compare/<int:product_id>')

# Order routes
api.add_resource(OrderResource, '/orders')
api.add_resource(AdminOrderResource, '/orders/admin')
api.add_resource(AdminOrderDetailResource, '/orders/admin/<int:order_id>')
api.add_resource(OrderStatusResource, '/orders/status/<int:order_id>')

# payment docs invoice and receipt routes
api.add_resource(
    PaymentResource, '/payment/<string:order_id>/<string:doc_type>')

# payment resource
api.add_resource(MpesaPaymentResource, '/mpesa/initiate')
api.add_resource(MpesaPaymentRetryResource, '/mpesa/retry')
api.add_resource(MpesaCallbackResource, '/ganji/inaflow')
api.add_resource(PaymentStatusResource,
                 '/payment/status/<string:order_reference>')

# Review routes
api.add_resource(ReviewResource, '/reviews/<int:product_id>')

# Notification routes
api.add_resource(NotificationResource, '/notifications')
api.add_resource(AdminNotificationResource, '/admin/notifications')

# Admin and User Management routes
api.add_resource(AdminUserManagement,
                 '/admin/users',
                 '/admin/user/<int:user_id>',
                 '/user/<int:user_id>/admin'
                 )

# admin login
api.add_resource(AdminLogin, '/admin/login')

# Audit logs
api.add_resource(AuditLogResource, '/admin/auditlogs')

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
