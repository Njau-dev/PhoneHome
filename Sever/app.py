from flask import Flask, jsonify, request, json
from flask_restful import Resource, Api
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, JWTManager, get_jwt
from flask_migrate import Migrate
from flask_cors import CORS
from datetime import timedelta, datetime
from functools import wraps
from models import db, User, Admin, Category, Brand, Phone, Tablet, Audio, Laptop, Cart, CartItem, Order, OrderItem, Review, WishList, Notification, AuditLog, Address, Payment, Shipment, Product, ProductVariation, Compare, CompareItem
import cloudinary
import cloudinary.uploader
from flask.views import MethodView
import os
import cloudinary.api
from dotenv import load_dotenv
import logging
from sqlalchemy import func, Table, Column, Integer, ForeignKey
import traceback
from sqlalchemy.exc import SQLAlchemyError
from collections import defaultdict

load_dotenv(override=True)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

#Validate environment variables
required_env_vars = [
    'SQLALCHEMY_DATABASE_URI',
    'SECRET_KEY',
    'JWT_SECRET_KEY',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
]

missing_vars = [var for var in required_env_vars if not os.getenv(var)]
if missing_vars:
    raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

cloudinary.config(
    cloud_name = os.getenv ("CLOUDINARY_CLOUD_NAME"),
    api_key = os.getenv ("CLOUDINARY_API_KEY"),
    api_secret = os.getenv ("CLOUDINARY_API_SECRET"),
    debug = True,
    secure = True
)

# Configure Flask app
app.config.update(
    SECRET_KEY=os.getenv('SECRET_KEY'),
    SQLALCHEMY_DATABASE_URI=os.getenv('SQLALCHEMY_DATABASE_URI'),
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
    JWT_SECRET_KEY=os.getenv('JWT_SECRET_KEY')
)


# Initialize Extensions
db.init_app(app)
migrate = Migrate(app, db)
cors = CORS(app)
api = Api(app)
jwt = JWTManager(app)

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

            return {"Message": "Sign-Up Successful!"}, 201

        except Exception as e:
            logger.error(f"Error during Sign Up: {e}")
            return {"Error": "Internal Server Error"}, 500

# Login
class Login(Resource):
    def post(self):
        data = request.get_json()
        email = data['email']
        password = data['password']

        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password_hash, password):
            token = create_access_token(identity=str(user.id), expires_delta=timedelta(days=2))
            return {"Message": "Login Successful!", "token": token}, 200
        else:
            return {"Error": "Invalid Email or Password!"}, 401

# Profile View and Update
class ProfileView(MethodView):
    decorators = [jwt_required()]

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
    decorators = [jwt_required()]

    def get(self):
        current_user_id = get_jwt_identity()
        user = db.session.get(User, current_user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        try:
            # Get order count
            order_count = Order.query.filter_by(user_id=current_user_id).count()
            
            # Get total payment amount
            total_payment = db.session.query(func.sum(Order.total_amount)).\
                filter(Order.user_id == current_user_id).scalar() or 0
            
            # Get wishlist count - modified to count items in wishlist_products
            wishlist = WishList.query.filter_by(user_id=current_user_id).first()
            wishlist_count = len(wishlist.products) if wishlist else 0
                      
            # Get review count
            review_count = Review.query.filter_by(user_id=current_user_id).count()
            
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
    decorators = [jwt_required()]

    def get(self):
        try:
            current_user_id = get_jwt_identity()
            user = db.session.get(User, current_user_id)

            if not user:
                return jsonify({"error": "User not found"}), 404

            # Get recent orders
            recent_orders = []
            orders = Order.query.filter_by(user_id=current_user_id)\
                .order_by(Order.created_at.desc())\
                .limit(5).all()
                
            for order in orders:
                order_items = OrderItem.query.filter_by(order_id=order.id).all()
                items = []
                
                for order_item in order_items:
                    if order_item.product:  # Check if product exists
                        item_data = {
                            "id": order_item.product.id,
                            "name": order_item.product.name,
                            "brand": order_item.product.brand.name if order_item.product.brand else "N/A",
                            "image_url": order_item.product.image_urls[0] if order_item.product.image_urls else None,
                            "quantity": order_item.quantity,
                            "variation_name": order_item.variation_name,
                            "price": order_item.variation_price or order_item.product.price
                        }
                        items.append(item_data)
                
                order_data = {
                    "id": order.id,
                    "total_amount": order.total_amount,
                    "status": order.status,
                    "payment": order.payment,
                    "date": order.created_at.isoformat(),
                    "items": items
                }
                recent_orders.append(order_data)
            
            return jsonify(recent_orders), 200
            
        except Exception as e:
            logger.error(f"Error fetching profile orders: {e}")
            return jsonify({"error": "An error occurred while fetching profile orders."}), 500

# Profile Wishlist
class ProfileWishlistView(MethodView):
    decorators = [jwt_required()]

    def get(self):
        try:
            current_user_id = get_jwt_identity()
            wishlist = WishList.query.filter_by(user_id=current_user_id).first()

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
            logger.error(f"Error fetching profile wishlist: {str(e)}\n{traceback.format_exc()}")
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


# Product (Phones, Laptops, Tablets, Audio) Management

# Initialize logger
logger = logging.getLogger(__name__)

# Allowed extensions for file uploads
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Product Resource (Production-Ready Version)
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
                base_data = {
                    'id': product.id,
                    'name': product.name,
                    'price': product.price,
                    'description': product.description,
                    'image_urls': product.image_urls,
                    'category': product.category.name,
                    'brand': product.brand.name,
                    'type': product_type,
                    'hasVariation': product.hasVariation,  # **Added field**
                    'isBestSeller': product.isBestSeller  # **Added field**
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
                    all_products.append(serialize_product(product, product_type))
            
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

            hasVariation = request.form.get('hasVariation', 'false').lower() == 'true'  # Boolean flag for variations
            isBestSeller = request.form.get('isBestSeller', 'false').lower() == 'true'  # Boolean flag for bestseller


            # Ensure required fields are provided
            if not all([name, price, description, category_id, brand_id, product_type, image_files]):
                return {"Error": "Missing required fields"}, 400

            # Validate image files
            uploaded_urls = []
            for image_file in image_files:
                if image_file and allowed_file(image_file.filename):
                    try:
                        logger.info(f"Uploading {image_file.filename} to Cloudinary...")
                        result = cloudinary.uploader.upload(image_file)
                        uploaded_urls.append(result['secure_url'])  # Store secure URL from Cloudinary
                        logger.info(f"Uploaded to: {result['secure_url']}")
                    except cloudinary.exceptions.Error as e:
                        logger.error(f"Cloudinary upload failed for {image_file.filename}: {e}")
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
            product.description = request.form.get('description', product.description)
            product.category_id = request.form.get('category_id', product.category_id)
            product.brand_id = request.form.get('brand_id', product.brand_id)
            product.isBestSeller = request.form.get('isBestSeller', str(product.isBestSeller)).lower() == 'true'
            product.hasVariation = request.form.get('hasVariation', str(product.hasVariation)).lower() == 'true'

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
                product.processor = request.form.get('processor', product.processor)
                product.main_camera = request.form.get('main_camera', product.main_camera)
                product.front_camera = request.form.get('front_camera', product.front_camera)
                product.connectivity = request.form.get('connectivity', product.connectivity)
                product.colors = request.form.get('colors', product.colors)
                product.os = request.form.get('os', product.os)
            elif isinstance(product, Laptop):
                product.ram = request.form.get('ram', product.ram)
                product.storage = request.form.get('storage', product.storage)
                product.battery = request.form.get('battery', product.battery)
                product.display = request.form.get('display', product.display)
                product.processor = request.form.get('processor', product.processor)
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
                            (v for v in product.variations if v.ram == ram and v.storage == storage), None
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
                "isBestSeller": product.isBestSeller
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

            # Log the product information before deletion
            logger.info(f"Attempting to delete product with ID {product_id}: {product.name}")

            # Delete the product from the database
            db.session.delete(product)
            db.session.commit()

            logger.info(f"Product with ID {product_id} deleted successfully")
            return {"Message": f"{product.name} deleted successfully"}, 200

        except Exception as e:
            # Log the error and return a 500 response in case of an error
            logger.error(f"Error deleting product with ID {product_id}: {e}")
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
                product_id = int(data['productId'])  # Convert productId to integer
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
                product_id = int(data['productId'])  # Convert productId to integer
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
                variation_name = None if variation_name in ['null', None, ''] else variation_name

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
                product_id = int(data['productId'])  # Convert productId to integer
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
                variation_name = None if variation_name in ['null', None, ''] else variation_name

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
            wishlist = WishList.query.filter_by(user_id=current_user_id).first()
            
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
            logger.error(f"Error fetching wishlist: {str(e)}\n{traceback.format_exc()}")
            return {"Error": "An error occurred while fetching wishlist"}, 500



    @jwt_required()
    def post(self):
        try:
            current_user_id = get_jwt_identity()
            data = request.get_json()
            
            if not data or 'product_id' not in data:
                logger.error("Missing product_id in request")
                return {"Error": "Product ID is required"}, 400

            # Validate product_id is an integer
            try:
                product_id = int(data['product_id'])
            except (TypeError, ValueError):
                logger.error(f"Invalid product ID format: {data.get('product_id')}")
                return {"Error": "Invalid product ID format"}, 400

            # Check if product exists
            product = db.session.get(Product, product_id)
            if not product:
                logger.error(f"Product not found: {product_id}")
                return {"Error": "Product not found"}, 404

            # Get or create wishlist
            wishlist = WishList.query.filter_by(user_id=current_user_id).first()
            if not wishlist:
                wishlist = WishList(user_id=current_user_id)
                try:
                    db.session.add(wishlist)
                    db.session.commit()
                except SQLAlchemyError as e:
                    logger.error(f"Error creating wishlist: {e}")
                    db.session.rollback()
                    return {"Error": "Failed to create wishlist"}, 500

            # Check if product is already in wishlist
            if product in wishlist.products:
                return {"Message": "Product already in wishlist"}, 200

            # Add product to wishlist
            try:
                wishlist.products.append(product)
                db.session.commit()
                logger.info(f"Product {product_id} added to wishlist for user {current_user_id}")
                return {"Message": "Product added to wishlist!"}, 201
            except SQLAlchemyError as e:
                logger.error(f"Database error while adding to wishlist: {e}")
                db.session.rollback()
                return {"Error": "Failed to add product to wishlist"}, 500

        except Exception as e:
            logger.error(f"Unexpected error in wishlist post: {str(e)}\n{traceback.format_exc()}")
            return {"Error": "An unexpected error occurred"}, 500
        

    @jwt_required()
    def delete(self, product_id):
        try:
            current_user_id = get_jwt_identity()
            wishlist = WishList.query.filter_by(user_id=current_user_id).first()
            
            if not wishlist:
                return {"Error": "Wishlist not found"}, 404

            product = Product.query.get(product_id)
            if not product:
                return {"Error": "Product not found"}, 404

            if product not in wishlist.products:
                return {"Error": "Product not found in wishlist"}, 404

            try:
                wishlist.products.remove(product)
                db.session.commit()
                return {"Message": "Product removed from wishlist!"}, 200
            except SQLAlchemyError as e:
                logger.error(f"Database error while removing from wishlist: {e}")
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
            twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
            old_items = CompareItem.query.filter(
                CompareItem.compare_id == compare.id,
                CompareItem.created_at <= twenty_four_hours_ago
            ).all()
            
            for item in old_items:
                db.session.delete(item)
            
            db.session.commit()
            
            # Get remaining valid items
            compare_items = CompareItem.query.filter_by(compare_id=compare.id).all()
            
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
            product = Product.query.get(data['product_id'])
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
            current_items_count = CompareItem.query.filter_by(compare_id=compare.id).count()
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
        current_user_id = get_jwt_identity()
        orders = Order.query.filter_by(user_id=current_user_id).all()

        if not orders:
            return {"Message": "No orders found!"}, 404
        
        # Fetch order items for all orders
        order_items = OrderItem.query.filter(OrderItem.order_id.in_([order.id for order in orders])).all()
        
        # Extract unique product IDs
        product_ids = {item.product_id for item in order_items}

        # Fetch product details in bulk
        products = Product.query.filter(Product.id.in_(product_ids)).all()
        product_map = {
            product.id: {
                "name": product.name,
                "image_urls": product.image_urls,
                "price": product.price
            } for product in products
        }

        order_list = []
        for order in orders:
            items = [
                {
                    "product_id": item.product_id,
                    "name": product_map.get(item.product_id, {}).get("name", "Product Not Found"),
                    "image_urls": product_map.get(item.product_id, {}).get("image_urls", []),
                    "quantity": item.quantity,
                    "variation_name": item.variation_name,
                    "price": item.variation_price if item.variation_price is not None else product_map.get(item.product_id, {}).get("price")
                } for item in order_items if item.order_id == order.id
            ]
            order_list.append({
                "order_id": order.id,
                "total_amount": order.total_amount,
                "status": order.status,
                "payment_method": order.payment_method,
                "payment": order.payment,
                "address": order.address,
                "date": order.date,
                "items": items
            })
        
        return {"orders": order_list}, 200

    @jwt_required()
    def post(self):
        current_user_id = get_jwt_identity()
        data = request.get_json()

        # Fetch cart and validate it
        cart = Cart.query.filter_by(user_id=current_user_id).first()
        if not cart:
            return {"Error": "Cart not found!"}, 404
        cart_items = CartItem.query.filter_by(cart_id=cart.id).all()
        if not cart_items:
            return {"Error": "Your cart is empty!"}, 400

        # Validate address and total_amount from frontend
        address = data.get('address')
        payment_method = data.get('payment_method')
        total_amount = data.get('total_amount')
        if not address or not total_amount:
            return {"Error": "Address and total amount are required!"}, 400

        # Create new Order
        new_order = Order(
            user_id=current_user_id,
            total_amount=total_amount,
            address=address,
            payment_method=payment_method,
            payment=False,
            status="Order Placed"
        )
        db.session.add(new_order)
        db.session.commit()

        # Transfer cart items to OrderItems
        for item in cart_items:
            order_item = OrderItem(
                order_id=new_order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                variation_name=item.variation_name,
                variation_price=item.variation_price
            )
            db.session.add(order_item)
            db.session.delete(item)  # Remove from cart

        db.session.commit()
        return {"Message": "Order placed successfully!"}, 201
    

class AdminOrderResource(Resource):
    @jwt_required()
    @admin_required
    def get(self):
        orders = Order.query.all()

        if not orders:
            return {"Message": "No orders found!"}, 404
        
        # Fetch order items for all orders
        order_items = OrderItem.query.filter(OrderItem.order_id.in_([order.id for order in orders])).all()
        
        # Extract unique product IDs
        product_ids = {item.product_id for item in order_items}

        # Fetch product details in bulk (only fetching product names)
        products = Product.query.filter(Product.id.in_(product_ids)).all()
        product_map = {
            product.id: product.name for product in products
        }

        # Build order list
        order_list = []
        for order in orders:
            items = [
                {
                    "product_id": item.product_id,
                    "name": product_map.get(item.product_id, "Product Not Found"),
                    "quantity": item.quantity,
                    "variation_name": item.variation_name
                } for item in order_items if item.order_id == order.id
            ]
            order_list.append({
                "order_id": order.id,
                "user_id": order.user_id,
                "total_amount": order.total_amount,
                "status": order.status,
                "payment_method": order.payment_method,
                "payment": order.payment,
                "address": order.address,
                "date": order.date,
                "items": items
            })
        
        return {"orders": order_list}, 200


class OrderStatusResource(Resource):
    @jwt_required()
    @admin_required
    def put(self, order_id):
        data = request.get_json()
        new_status = data.get('status')

        ORDER_STATUSES = ["Order Placed", "Packing", "Shipped", "Out for Delivery", "Delivered"]

        if new_status not in ORDER_STATUSES:
            return {"Error": "Invalid order status!"}, 400

        order = Order.query.get_or_404(order_id)
        order.status = new_status
        db.session.commit()

        return {"Message": f"Order status updated to {new_status}!"}, 200


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
        current_user_id = get_jwt_identity()
        data = request.get_json()
        rating = data.get('rating')
        comment = data.get('comment')

        product = Product.query.get_or_404(product_id)

        # Check if user already reviewed the product
        existing_review = Review.query.filter_by(user_id=current_user_id, product_id=product.id).first()
        if existing_review:
            return {"Error": "You have already reviewed this product."}, 400

        new_review = Review(
            user_id=current_user_id,
            product_id=product.id,
            rating=rating,
            comment=comment
        )
        db.session.add(new_review)
        db.session.commit()

        return {"Message": "Review added successfully!"}, 201

    @jwt_required()
    def delete(self, product_id):
        current_user_id = get_jwt_identity()
        review = Review.query.filter_by(user_id=current_user_id, product_id=product_id).first_or_404()

        db.session.delete(review)
        db.session.commit()
        return {"Message": "Review deleted!"}, 200

# Notifications
class NotificationResource(Resource):
    @jwt_required()
    def get(self):
        current_user_id = get_jwt_identity()
        notifications = Notification.query.filter_by(user_id=current_user_id).all()

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
        notification = Notification.query.filter_by(id=notification_id, user_id=current_user_id).first_or_404()

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
    @admin_required  # Admin-only access
    def get(self):
        users = User.query.all()
        user_list = [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "phone_number": user.phone_number,
                "address": user.address
            }
            for user in users
        ]
        return {"users": user_list}, 200

    @jwt_required()
    @admin_required
    def delete(self, user_id):
        user = User.query.get_or_404(user_id)
        db.session.delete(user)
        db.session.commit()
        return {"Message": "User deleted successfully!"}, 200

    @jwt_required()
    @admin_required
    def put(self, user_id):
        user = User.query.get_or_404(user_id)
        data = request.get_json()

        user.username = data.get('username', user.username)
        user.email = data.get('email', user.email)
        user.phone_number = data.get('phone_number', user.phone_number)
        user.address = data.get('address', user.address)

        db.session.commit()
        return {"Message": "User updated successfully!"}, 200

# Admin Management Resource for CRUD on Admins
class AdminManagementResource(Resource):
    @jwt_required()
    @admin_required
    def get(self):
        admins = Admin.query.all()
        admin_list = [
            {
                "id": admin.id,
                "username": admin.username,
                "email": admin.email
            }
            for admin in admins
        ]
        return {"admins": admin_list}, 200

    @jwt_required()
    @admin_required
    def post(self):
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if Admin.query.filter_by(email=email).first():
            return {"Error": "Admin with this email already exists!"}, 400

        hashed_password = generate_password_hash(password)
        new_admin = Admin(
            username=username,
            email=email,
            password_hash=hashed_password,
        )
        db.session.add(new_admin)
        db.session.commit()
        return {"Message": "New admin created!"}, 201

    @jwt_required()
    @admin_required
    def delete(self, admin_id):
        admin = Admin.query.get_or_404(admin_id)
        db.session.delete(admin)
        db.session.commit()
        return {"Message": "Admin deleted!"}, 200

    @jwt_required()
    @admin_required
    def put(self, admin_id):
        admin = Admin.query.get_or_404(admin_id)
        data = request.get_json()

        admin.username = data.get('username', admin.username)
        admin.email = data.get('email', admin.email)
        admin.password_hash = generate_password_hash(data.get('password', admin.password_hash))

        db.session.commit()
        return {"Message": "Admin updated successfully!"}, 200

class AdminLogin(Resource):
    def post(self):
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        admin = Admin.query.filter_by(email=email).first()

        if admin and check_password_hash(admin.password_hash, password):
            access_token = create_access_token(identity=str(admin.id))
            return {"access_token": access_token}, 200
        else:
            return {"error": "Invalid credentials!"}, 401

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

# Password Change Resource (for Users)
class PasswordChangeResource(Resource):
    @jwt_required()
    def post(self):
        current_user_id = get_jwt_identity()
        user = User.query.get_or_404(current_user_id)
        data = request.get_json()

        old_password = data.get('old_password')
        new_password = data.get('new_password')

        if not check_password_hash(user.password_hash, old_password):
            return {"Error": "Old password is incorrect!"}, 400

        user.password_hash = generate_password_hash(new_password)
        db.session.commit()
        return {"Message": "Password updated successfully!"}, 200


 
class CategoryResource(Resource):
    def get(self):
        # Fetch all categories
        categories = Category.query.all()
        category_list = [{"id": category.id, "name": category.name} for category in categories]
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
                brands = Brand.query.filter_by(category_id=category_id).all()
            else:
                # If no category_id, return all brands
                brands = Brand.query.all()
            
            return [{
                "id": brand.id, 
                "name": brand.name,
                "category": {
                    "id": brand.category.id,
                    "name": brand.category.name
                }
            } for brand in brands], 200
        except Exception as e:
            logger.error(f"Error fetching brands: {e}")
            return {"Error": "An error occurred while fetching brands"}, 500

    def post(self):
        try:
            data = request.get_json()
            
            if not all(key in data for key in ['name', 'category_id']):
                return {"Error": "Name and category_id are required"}, 400
                
            # Verify category exists
            category = Category.query.get_or_404(data['category_id'])
            
            new_brand = Brand(
                name=data['name'],
                category_id=data['category_id']
            )
            db.session.add(new_brand)
            db.session.commit()
            
            return {
                "Message": "Brand Created Successfully!",
                "brand": {
                    "id": new_brand.id,
                    "name": new_brand.name,
                    "category": {
                        "id": category.id,
                        "name": category.name
                    }
                }
            }, 201
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating brand: {e}")
            return {"Error": "An error occurred while creating the brand"}, 500
        

# Single Brand Resource for managing a specific brand
class SingleBrandResource(Resource):
    # @jwt_required()
    # @admin_required
    def get(self, brand_id):
        brand = Brand.query.get_or_404(brand_id)
        return {"id": brand.id, "name": brand.name}, 200

    @jwt_required()
    # @admin_required
    def put(self, brand_id):
        data = request.get_json()
        brand = Brand.query.get_or_404(brand_id)
        brand.name = data['name']
        db.session.commit()
        return {"Message": "Brand Updated Successfully!"}, 200

    @jwt_required()
    # @admin_required
    def delete(self, brand_id):
        brand = Brand.query.get_or_404(brand_id)
        db.session.delete(brand)
        db.session.commit()
        return {"Message": "Brand Deleted Successfully!"}, 200


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

# Profile routes
profile_view = ProfileView.as_view('profile_view')
app.add_url_rule('/api/profile', view_func=profile_view, methods=['GET', 'PUT'])
app.add_url_rule('/api/profile/stats', view_func=ProfileStatsView.as_view('profile_stats'))
app.add_url_rule('/api/profile/orders', view_func=ProfileOrdersView.as_view('profile_orders'))
app.add_url_rule('/api/profile/wishlist', view_func=ProfileWishlistView.as_view('profile_wishlist'))

# Product routes
api.add_resource(ProductResource, '/products')
api.add_resource(GetProductsByType, '/products/<string:product_type>')
api.add_resource(GetProductsByCategory, '/products/category/<int:category_id>')
api.add_resource(GetProductById, '/product/<int:product_id>')
api.add_resource(DeleteProductById, '/product/<int:product_id>')
api.add_resource(ProductVariationResource, '/products/<int:product_id>/variations')
api.add_resource(ProductUpdateResource, '/products/<int:product_id>')

#brand routes
api.add_resource(BrandResource, '/brands')
api.add_resource(SingleBrandResource, '/brands/<int:brand_id>')

#category route
api.add_resource(CategoryResource, '/categories', '/categories/<int:category_id>')

# Cart routes
api.add_resource(CartResource, '/cart')

# Wishlist routes
api.add_resource(WishlistResource, '/wishlist', '/wishlist/<int:product_id>')

# compare route
api.add_resource(CompareResource, '/compare', '/compare/<int:product_id>')

# Order routes
api.add_resource(OrderResource, '/orders')
api.add_resource(AdminOrderResource, '/orders/admin')
api.add_resource(OrderStatusResource, '/orders/status/<int:order_id>')

# Review routes
api.add_resource(ReviewResource, '/reviews/<int:product_id>')

# Notification routes
api.add_resource(NotificationResource, '/notifications')
api.add_resource(AdminNotificationResource, '/admin/notifications')

# Admin and User Management routes
api.add_resource(AdminUserManagement, '/admin/users', '/admin/users/<int:user_id>')
api.add_resource(AdminManagementResource, '/admin/admins', '/admin/admins/<int:admin_id>')
api.add_resource(AdminLogin, '/admin/login')

# Password management
api.add_resource(PasswordChangeResource, '/password/change')

# Audit logs
api.add_resource(AuditLogResource, '/admin/auditlogs')

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
