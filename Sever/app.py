from flask import Flask, jsonify, request
from flask_restful import Resource, Api
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, JWTManager, get_jwt
from flask_migrate import Migrate
from flask_cors import CORS
from datetime import timedelta
from functools import wraps
from models import db, User, Admin, Category, Brand, Phone, Tablet, Audio, Laptop, Cart, CartItem, Order, OrderItem, Review, WishList, Notification, AuditLog, Address, Payment, Shipment, Product, ProductVariation
import cloudinary
import cloudinary.uploader
from flask.views import MethodView
import os
import cloudinary.api
from dotenv import load_dotenv
import logging
import traceback

load_dotenv()
logger = logging.getLogger(__name__)
# Initialize Flask app
app = Flask(__name__)

 

cloudinary.config(
    cloud_name = os.getenv ("CLOUDINARY_CLOUD_NAME"),
    api_key = os.getenv ("CLOUDINARY_API_KEY"),
    api_secret = os.getenv ("CLOUDINARY_API_SECRET"),
    debug = True,
    secure = True
)
 

# # Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


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
                return {"Error": "Email Already Exists"}, 401

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
            token = create_access_token(identity=user.id, expires_delta=timedelta(days=2))
            return {"Message": "Login Successful!", "token": token}, 200
        else:
            return {"Error": "Invalid Email or Password!"}, 401

# Profile View and Update
class ProfileView(MethodView):
    decorators = [jwt_required()]

    def get(self):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

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
        user = User.query.get(current_user_id)

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
                    'type': product_type
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
                return {**base_data, **additional_data}
            
            # Iterate over all product types and serialize them
            for product_type, products in product_types.items():
                for product in products:
                    all_products.append(serialize_product(product, product_type))
            
            return {'products': all_products}, 200

        except Exception as e:
            logger.error(f"Error fetching products: {e}")
            return {"Error": "An error occurred while fetching products"}, 500

    # @jwt_required()
    def post(self):
        try:
            # Validate input data
            name = request.form.get('name')
            price = request.form.get('price')
            description = request.form.get('description')
            category_id = request.form.get('category_id')
            brand_id = request.form.get('brand_id')
            product_type = request.form.get('type')  # 'phone', 'laptop', 'tablet', 'audio'
            image_files = request.files.getlist('image_urls')  # List of image files

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
                    image_urls=uploaded_urls,  # Store the Cloudinary URLs
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
                    brand=brand
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
                    brand=brand
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
                    brand=brand
                )
            elif product_type == 'audio':
                product = Audio(
                    name=name,
                    price=price,
                    description=description,
                    image_urls=uploaded_urls,
                    battery=request.form.get('battery'),
                    category=category,
                    brand=brand
                )
            else:
                return {"Error": "Invalid product type"}, 400

            # Add and commit product to the database
            db.session.add(product)
            db.session.commit()

            logger.info(f"Product {name} added successfully")
            return {"Message": f"{product_type.capitalize()} added successfully!"}, 201

        except Exception as e:
            db.session.rollback()  # Rollback in case of error
            logger.error(f"Error adding product: {e}")
            return {"Error": "An error occurred while adding the product"}, 500

# logger.error(f"Error adding product: {e}\n{traceback.format_exc()}")

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
            category = product.category.name  # Assuming this refers to the category name

            # Base product data that all products share
            product_data = {
                "id": product.id,
                "name": product.name,
                "price": product.price,
                "brand": product.brand.name,
                "category": product.category.name,
                "description": product.description,
                "image_urls": product.image_urls,
                "type": product.type    
                # "variations": product.variations
            }

            # Use switch-case logic based on product category
            if category == 'Test' or category == 'Test 2':
                # Include variations
                variations = [
                    {
                        "ram": variation.ram,
                        "storage": variation.storage,
                        "price": variation.price,
                    }
                    for variation in product.variations
                ]
                product_data["variations"] = variations

                # Other fields specific to Phones/Tablets
                product_data.update({
                    "battery": product.battery,
                    "main_camera": product.main_camera,
                    "front_camera": product.front_camera,
                    "display": product.display,
                    "processor": product.processor,
                    "connectivity": product.connectivity,
                    "colors": product.colors,
                    "os": product.os,
                })

            elif category == 'Laptops':
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

            # Return the full product data based on category
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
        current_user_id = get_jwt_identity()
        cart = Cart.query.filter_by(user_id=current_user_id).first()
        if not cart:
            return {"Error": "Cart is empty!"}, 404
        cart_items = CartItem.query.filter_by(cart_id=cart.id).all()
        items = [
            {
                "product_name": item.product.name,
                "quantity": item.quantity,
                "total_price": item.quantity * item.product.price
            } for item in cart_items
        ]
        return {"cart": items}, 200

    @jwt_required()
    def post(self):
        current_user_id = get_jwt_identity()
        data = request.get_json()

        cart = Cart.query.filter_by(user_id=current_user_id).first()
        if not cart:
            cart = Cart(user_id=current_user_id)
            db.session.add(cart)
            db.session.commit()

        product = Product.query.get_or_404(data['product_id'])
        cart_item = CartItem.query.filter_by(cart_id=cart.id, product_id=product.id).first()

        if cart_item:
            cart_item.quantity += data['quantity']
        else:
            cart_item = CartItem(cart_id=cart.id, product_id=product.id, quantity=data['quantity'])
            db.session.add(cart_item)

        db.session.commit()
        return {"Message": "Product added to cart!"}, 201

    @jwt_required()
    def delete(self, product_id):
        current_user_id = get_jwt_identity()
        cart = Cart.query.filter_by(user_id=current_user_id).first_or_404()
        cart_item = CartItem.query.filter_by(cart_id=cart.id, product_id=product_id).first_or_404()

        db.session.delete(cart_item)
        db.session.commit()
        return {"Message": "Product removed from cart!"}, 200

# Wishlist Management
class WishlistResource(Resource):
    @jwt_required()
    def get(self):
        current_user_id = get_jwt_identity()
        wishlist = WishList.query.filter_by(user_id=current_user_id).first()
        if not wishlist:
            return {"Error": "Wishlist is empty!"}, 404
        wishlist_items = [{"product_name": product.name} for product in wishlist.products]
        return {"wishlist": wishlist_items}, 200

    @jwt_required()
    def post(self):
        current_user_id = get_jwt_identity()
        data = request.get_json()
        product = Product.query.get_or_404(data['product_id'])

        wishlist = WishList.query.filter_by(user_id=current_user_id).first()
        if not wishlist:
            wishlist = WishList(user_id=current_user_id)
            db.session.add(wishlist)
            db.session.commit()

        wishlist.products.append(product)
        db.session.commit()
        return {"Message": "Product added to wishlist!"}, 201

    @jwt_required()
    def delete(self, product_id):
        current_user_id = get_jwt_identity()
        wishlist = WishList.query.filter_by(user_id=current_user_id).first_or_404()
        product = Product.query.get_or_404(product_id)

        if product not in wishlist.products:
            return {"Error": "Product not found in wishlist!"}, 404

        wishlist.products.remove(product)
        db.session.commit()
        return {"Message": "Product removed from wishlist!"}, 200

# Order Management
class OrderResource(Resource):
    @jwt_required()
    def get(self):
        current_user_id = get_jwt_identity()
        orders = Order.query.filter_by(user_id=current_user_id).all()
        if not orders:
            return {"Message": "No orders found!"}, 404
        order_list = []
        for order in orders:
            items = OrderItem.query.filter_by(order_id=order.id).all()
            order_items = [
                {
                    "product_name": item.product.name,
                    "quantity": item.quantity,
                    "price": item.product.price
                } for item in items
            ]
            order_list.append({
                "order_id": order.id,
                "items": order_items,
                "total_price": sum(item['price'] * item['quantity'] for item in order_items)
            })
        return {"orders": order_list}, 200

    @jwt_required()
    def post(self):
        current_user_id = get_jwt_identity()
        cart = Cart.query.filter_by(user_id=current_user_id).first_or_404()
        cart_items = CartItem.query.filter_by(cart_id=cart.id).all()

        if not cart_items:
            return {"Error": "Your cart is empty!"}, 400

        new_order = Order(user_id=current_user_id)
        db.session.add(new_order)
        db.session.commit()

        for item in cart_items:
            new_order_item = OrderItem(
                order_id=new_order.id,
                product_id=item.product_id,
                quantity=item.quantity
            )
            db.session.add(new_order_item)
            db.session.delete(item)  # Remove items from the cart after ordering

        db.session.commit()
        return {"Message": "Order placed successfully!"}, 201

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
            access_token = create_access_token(identity=admin.id)
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
    
class BrandResource(Resource):
    def get(self):
        brands = Brand.query.all()
        return [{"id": brand.id, "name": brand.name} for brand in brands], 200

    # @jwt_required()
    # @admin_required
    def post(self):
        data = request.get_json()
        new_brand = Brand(name=data['name'])
        db.session.add(new_brand)
        db.session.commit()
        return {"Message": "Brand Created Successfully!"}, 201


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
app.add_url_rule('/profile', view_func=profile_view, methods=['GET', 'PUT'])

# Product routes
api.add_resource(ProductResource, '/products')
api.add_resource(GetProductsByType, '/products/<string:product_type>')
api.add_resource(GetProductsByCategory, '/products/category/<int:category_id>')
api.add_resource(GetProductById, '/product/<int:product_id>')
api.add_resource(DeleteProductById, '/product/<int:product_id>')
api.add_resource(ProductVariationResource, '/products/<int:product_id>/variations')

# Cart routes
api.add_resource(CartResource, '/cart')

# Wishlist routes
api.add_resource(WishlistResource, '/wishlist')

# Order routes
api.add_resource(OrderResource, '/orders')

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

#brand routes
api.add_resource(BrandResource, '/brands')
api.add_resource(SingleBrandResource, '/brands/<int:brand_id>')

#category route
api.add_resource(CategoryResource, '/categories')

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
