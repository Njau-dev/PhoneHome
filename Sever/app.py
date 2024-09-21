from flask import Flask, jsonify, request
from flask_restful import Resource, Api
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, JWTManager, get_jwt
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from datetime import timedelta
from functools import wraps
from models import db, User, Admin, Category, Brand, Phone, Tablet, Audio, Laptop, Cart, CartItem, Order, OrderItem, Review, WishList, Notification, AuditLog
import cloudinary
import cloudinary.uploader
from flask.views import MethodView
import os
import cloudinary.api
from dotenv import load_dotenv
import logging

load_dotenv()

# Initialize Flask app
app = Flask(__name__)

cloudinary.config(
    cloud_name = os.getenv ("CLOUDINARY_CLOUD_NAME"),
    api_key = os.getenv ("CLOUDINARY_API_KEY"),
    api_secret = os.getenv ("CLOUDINARY_API_SECRET"),
    debug = True,
    secure = True
)


# Configuration
app.config['SECRET_KEY'] = '9b5d1a90246ca41fd5d81cf8debdc4ecb5bb82d7b7fb69a46aad44c2ca55e8ae'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///phonehub.db'
app.config['JWT_SECRET_KEY'] = 'b4506f4f33d07a7467281fc9d373de85cc97b4c104334d0c7553fad7c6deea1b'
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

# SignUp Resource
class SignUp(Resource):
    def post(self):
        try:
            data = request.get_json()
            username = data.get('username')
            email = data.get('email')
            phone_number = data.get('phone_number')
            address = data.get('address')
            password = data.get('password')

            if not all([username, email, phone_number, address, password]):
                return {"Error": "Missing required fields"}, 400

            if User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first():
                return {"Error": "Username or Email Already Exists"}, 401

            hashed_password = generate_password_hash(password)
            new_user = User(
                username=username,
                email=email,
                phone_number=phone_number,
                address=address,
                password_hash=hashed_password
            )
            db.session.add(new_user)
            db.session.commit()

            return {"Message": "Sign-Up Successful!"}, 201

        except Exception as e:
            return {"Error": "Internal Server Error"}, 500

# Login Resource
class Login(Resource):
    def post(self):
        data = request.get_json()
        email = data['email']
        password = data['password']

        user = User.query.filter_by(email=email).first()
        #check if admin email exists
        user = Admin.query.filter_by(email=email).first()

        if user and check_password_hash(user.password_hash, password):
            token = create_access_token(
                identity=user.id,
                expires_delta=timedelta(days=2)
            )
            return {"Message": "Login Successful!", "token": token}, 200
        else:
            return {"Error": "Invalid Email or Password!"}, 401
        

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

        # Basic Input Validation
        if 'email' in data:
            if not self.validate_email(data['email']):
                return jsonify({"error": "Invalid email format"}), 400

        user.username = data.get('username', user.username)
        user.email = data.get('email', user.email)
        user.phone_number = data.get('phone_number', user.phone_number)
        user.address = data.get('address', user.address)

        try:
            db.session.commit()
            return jsonify({"message": "Profile updated successfully"}), 200
        except Exception as e:
            db.session.rollback()
            # Ideally, log the exception here
            return jsonify({"error": "An error occurred while updating the profile."}), 500

    @staticmethod
    def validate_email(email):
        email_regex = r'^\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        return re.match(email_regex, email) is not None

# Logout Resource (with persistent token blacklisting)
class Logout(Resource):
    @jwt_required()
    def delete(self):
        jti = get_jwt()['jti']
        blacklisted_token = BlacklistToken(token=jti)
        db.session.add(blacklisted_token)
        db.session.commit()
        return {"Message": "Logout Successful!"}, 200


# Define the admin_required decorator
def admin_required(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        current_user_id = get_jwt_identity()
        admin = Admin.query.get(current_user_id)
        if not admin:
            return {"Error": "Admin privileges required"}, 403
        return f(*args, **kwargs)
    return decorator

# Category Resource
class CategoryResource(Resource):
    def get(self):
        categories = Category.query.all()
        return [{"id": category.id, "name": category.name} for category in categories], 200

    @jwt_required()
    @admin_required
    def post(self):
        data = request.get_json()
        new_category = Category(name=data['name'])
        db.session.add(new_category)
        db.session.commit()
        return {"Message": "Category Created Successfully!"}, 201

# Single Category Resource for managing a specific category
class SingleCategoryResource(Resource):
    # @jwt_required()
    # @admin_required
    def get(self, category_id):
        category = Category.query.get_or_404(category_id)
        return {"id": category.id, "name": category.name}, 200

    @jwt_required()
    @admin_required
    def put(self, category_id):
        data = request.get_json()
        category = Category.query.get_or_404(category_id)
        category.name = data['name']
        db.session.commit()
        return {"Message": "Category Updated Successfully!"}, 200

    @jwt_required()
    @admin_required
    def delete(self, category_id):
        category = Category.query.get_or_404(category_id)
        db.session.delete(category)
        db.session.commit()
        return {"Message": "Category Deleted Successfully!"}, 200

# Brand Resource
class BrandResource(Resource):
    def get(self):
        brands = Brand.query.all()
        return [{"id": brand.id, "name": brand.name} for brand in brands], 200

    @jwt_required()
    @admin_required
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
    @admin_required
    def put(self, brand_id):
        data = request.get_json()
        brand = Brand.query.get_or_404(brand_id)
        brand.name = data['name']
        db.session.commit()
        return {"Message": "Brand Updated Successfully!"}, 200

    @jwt_required()
    @admin_required
    def delete(self, brand_id):
        brand = Brand.query.get_or_404(brand_id)
        db.session.delete(brand)
        db.session.commit()
        return {"Message": "Brand Deleted Successfully!"}, 200

# Phone Resource
class PhoneResource(Resource):
    def get(self):
        phones = Phone.query.all()
        return [
            {
                "id": phone.id,
                "name": phone.name,
                "price": phone.price,
                "category": phone.category.name,
                "brand": phone.brand.name,
                "image_urls": phone.image_urls_list,
            }
            for phone in phones
        ], 200

    @jwt_required()
    @admin_required
    def post(self):
        try:
            # Access form data as dictionary
            name = request.form.get('name')
            price = request.form.get('price')
            description = request.form.get('description')
            ram = request.form.get('ram')
            storage = request.form.get('storage')
            battery = request.form.get('battery')
            main_camera = request.form.get('main_camera')
            front_camera = request.form.get('front_camera')
            display = request.form.get('display')
            processor = request.form.get('processor')
            connectivity = request.form.get('connectivity')
            colors = request.form.get('colors')
            os = request.form.get('os')
            category_id = request.form.get('category_id')
            brand_id = request.form.get('brand_id')

            # # Handle file upload
            # image_file = request.files['image_urls']  # Handle file upload
            
            # # Upload image to Cloudinary
            # try:
            #     print("Uploading image to Cloudinary...")
            #     result = cloudinary.uploader.upload(image_file)
            #     file_url = result['secure_url']
            #     print(f"Image uploaded to: {file_url}")
            # except Exception as e:
            #     print(f"Cloudinary upload failed: {e}")
            #     return {"Error": f"Image upload failed: {str(e)}"}, 500
            
            image_files = request.files.getlist('image_urls')

            # Validate file types
            ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
            def allowed_file(filename):
                return '.' in filename and \
                       filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
            
            # Upload images to Cloudinary
            uploaded_urls = []
            for image_file in image_files:
                if image_file and allowed_file(image_file.filename):
                    try:
                        logger.info(f"Uploading {image_file.filename} to Cloudinary...")
                        result = cloudinary.uploader.upload(image_file)
                        uploaded_urls.append(result['secure_url'])
                        logger.info(f"Uploaded to: {result['secure_url']}")
                    except cloudinary.exceptions.Error as e:
                        logger.error(f"Cloudinary upload failed for {image_file.filename}: {e}")
                        return {"Error": f"Image upload failed for {image_file.filename}: {str(e)}"}, 500
                else:
                    return {"Error": f"Invalid file type for {image_file.filename}."}, 400

            if not uploaded_urls:
                return {"Error": "No valid images were uploaded."}, 400
            # Create new phone record
            category = Category.query.get_or_404(category_id)
            brand = Brand.query.get_or_404(brand_id)
            # Process colors
            colors_list = [color.strip() for color in colors.split(",")]
            colors_str = ",".join(colors_list)

            new_phone = Phone(
                name=name,
                price=price,
                description=description,
                image_urls=uploaded_urls,  # Store the Cloudinary URL
                ram=ram,
                storage=storage,
                battery=battery,
                main_camera=main_camera,
                front_camera=front_camera,
                display=display,
                processor=processor,
                connectivity=connectivity,
                colors=colors_str,  # Stored as comma-separated string
                os=os,
                category=category,
                brand=brand
            )
            
            db.session.add(new_phone)
            db.session.commit()
            return {"Message": "Phone added successfully!"}, 201

        except Exception as e:
            print(f"Unexpected error: {e}")
            return {"Error": "An error occurred while adding the phone", "Details": str(e)}, 500

# Single Phone Resource
class SinglePhoneResource(Resource):
    @jwt_required()
    def get(self, phone_id):
        phone = Phone.query.get_or_404(phone_id)
        return {
            "id": phone.id,
            "name": phone.name,
            "price": phone.price,
            "category": phone.category.name,
            "brand": phone.brand.name
        }, 200

    @jwt_required()
    @admin_required
    def put(self, phone_id):
        data = request.get_json()
        phone = Phone.query.get_or_404(phone_id)
        phone.name = data['name']
        phone.price = data['price']
        phone.description = data['description']
        phone.image_urls = ','.join(data['image_urls'])
        phone.ram = data['ram']
        phone.storage = data['storage']
        phone.battery = data['battery']
        phone.main_camera = data['main_camera']
        phone.front_camera = data['front_camera']
        phone.display = data['display']
        phone.processor = data['processor']
        phone.connectivity = data['connectivity']
        phone.colors = ','.join(data['colors'])
        phone.os = data['os']
        phone.category_id = data['category_id']
        phone.brand_id = data['brand_id']
        db.session.commit()
        return {"Message": "Phone Updated Successfully!"}, 200

    @jwt_required()
    @admin_required
    def delete(self, phone_id):
        phone = Phone.query.get_or_404(phone_id)
        db.session.delete(phone)
        db.session.commit()
        return {"Message": "Phone Deleted Successfully!"}, 200

# Cart Resource
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
                "phone_name": item.phone.name,
                "quantity": item.quantity,
                "total_price": item.quantity * item.phone.price
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

        phone = Phone.query.get_or_404(data['phone_id'])
        cart_item = CartItem.query.filter_by(cart_id=cart.id, phone_id=phone.id).first()

        if cart_item:
            cart_item.quantity += data['quantity']
        else:
            cart_item = CartItem(cart_id=cart.id, phone_id=phone.id, quantity=data['quantity'])
            db.session.add(cart_item)

        db.session.commit()
        return {"Message": "Phone added to cart!"}, 201

    @jwt_required()
    def delete(self, phone_id):
        current_user_id = get_jwt_identity()
        cart = Cart.query.filter_by(user_id=current_user_id).first_or_404()
        cart_item = CartItem.query.filter_by(cart_id=cart.id, phone_id=phone_id).first_or_404()

        db.session.delete(cart_item)
        db.session.commit()
        return {"Message": "Phone removed from cart!"}, 200

# Single Cart Item Resource
class SingleCartItemResource(Resource):
    @jwt_required()
    def delete(self, phone_id):
        current_user_id = get_jwt_identity()
        cart = Cart.query.filter_by(user_id=current_user_id).first_or_404()
        cart_item = CartItem.query.filter_by(cart_id=cart.id, phone_id=phone_id).first_or_404()
        db.session.delete(cart_item)
        db.session.commit()
        return {"Message": "Item removed from cart!"}, 200


# Order Resource
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
                    "phone_name": item.phone.name,
                    "quantity": item.quantity,
                    "price": item.price
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
                phone_id=item.phone_id,
                quantity=item.quantity,
                price=item.phone.price
            )
            db.session.add(new_order_item)
            db.session.delete(item)  # Remove items from the cart after ordering

        db.session.commit()
        return {"Message": "Order placed successfully!"}, 201

# Wishlist Resource
class WishlistResource(Resource):
    @jwt_required()
    def get(self):
        current_user_id = get_jwt_identity()
        wishlist = WishList.query.filter_by(user_id=current_user_id).first()
        if not wishlist:
            return {"Error": "Wishlist is empty!"}, 404
        wishlist_items = [{"phone_name": phone.name} for phone in wishlist.phones]
        return {"wishlist": wishlist_items}, 200

    @jwt_required()
    def post(self):
        current_user_id = get_jwt_identity()
        data = request.get_json()
        phone = Phone.query.get_or_404(data['phone_id'])

        wishlist = WishList.query.filter_by(user_id=current_user_id).first()
        if not wishlist:
            wishlist = WishList(user_id=current_user_id)
            db.session.add(wishlist)
            db.session.commit()

        wishlist.phones.append(phone)
        db.session.commit()
        return {"Message": "Phone added to wishlist!"}, 201

    @jwt_required()
    def delete(self, phone_id):
        current_user_id = get_jwt_identity()
        wishlist = WishList.query.filter_by(user_id=current_user_id).first_or_404()
        phone = Phone.query.get_or_404(phone_id)

        if phone not in wishlist.phones:
            return {"Error": "Phone not found in wishlist!"}, 404

        wishlist.phones.remove(phone)
        db.session.commit()
        return {"Message": "Phone removed from wishlist!"}, 200

# Review Resource
class ReviewResource(Resource):
    @jwt_required()
    def get(self, phone_id):
        reviews = Review.query.filter_by(phone_id=phone_id).all()
        if not reviews:
            return {"Message": "No reviews found for this phone."}, 404
        review_list = [
            {
                "user": review.user.username,
                "rating": review.rating,
                "comment": review.comment,
                "timestamp": review.timestamp
            } for review in reviews
        ]
        return {"reviews": review_list}, 200

    @jwt_required()
    def post(self, phone_id):
        current_user_id = get_jwt_identity()
        data = request.get_json()
        rating = data.get('rating')
        comment = data.get('comment')

        phone = Phone.query.get_or_404(phone_id)

        # Check if user already reviewed the phone
        existing_review = Review.query.filter_by(user_id=current_user_id, phone_id=phone.id).first()
        if existing_review:
            return {"Error": "You have already reviewed this phone."}, 400

        new_review = Review(
            user_id=current_user_id,
            phone_id=phone.id,
            rating=rating,
            comment=comment
        )
        db.session.add(new_review)
        db.session.commit()

        return {"Message": "Review added successfully!"}, 201

    @jwt_required()
    def delete(self, phone_id):
        current_user_id = get_jwt_identity()
        review = Review.query.filter_by(user_id=current_user_id, phone_id=phone_id).first_or_404()

        db.session.delete(review)
        db.session.commit()
        return {"Message": "Review deleted!"}, 200

# Notifications Resource
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
                "timestamp": notification.timestamp,
                "read": notification.read
            } for notification in notifications
        ]
        return {"notifications": notification_list}, 200

    @jwt_required()
    def put(self, notification_id):
        current_user_id = get_jwt_identity()
        notification = Notification.query.filter_by(id=notification_id, user_id=current_user_id).first_or_404()

        notification.read = True
        db.session.commit()

        return {"Message": "Notification marked as read."}, 200


# Admin Notification Management
class AdminNotificationResource(Resource):
    @jwt_required()
    @admin_required
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

# Admin Resource for managing Users
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
            password_hash=hashed_password
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

# Password Change Resource
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
                "timestamp": log.timestamp
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


# laptop Resource
class LaptopResource(Resource):
    def get(self):
        laptop = Laptop.query.all()
        return [
            {
                "id": laptop.id,
                "name": laptop.name,
                "price": laptop.price,
                "category": laptop.category.name,
                "brand": laptop.brand.name
            }
            for laptop in laptop
        ], 200

    @jwt_required()
    @admin_required
    def post(self):
        try:
            # Access form data as dictionary
            name = request.form.get('name')
            price = request.form.get('price')
            description = request.form.get('description')
            ram = request.form.get('ram')
            storage = request.form.get('storage')
            battery = request.form.get('battery')
            display = request.form.get('display')
            processor = request.form.get('processor')
            os = request.form.get('os')
            category_id = request.form.get('category_id')
            brand_id = request.form.get('brand_id')

            image_files = request.files.getlist('image_urls')

            # Validate file types
            ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
            def allowed_file(filename):
                return '.' in filename and \
                       filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
            
            # Upload images to Cloudinary
            uploaded_urls = []
            for image_file in image_files:
                if image_file and allowed_file(image_file.filename):
                    try:
                        logger.info(f"Uploading {image_file.filename} to Cloudinary...")
                        result = cloudinary.uploader.upload(image_file)
                        uploaded_urls.append(result['secure_url'])
                        logger.info(f"Uploaded to: {result['secure_url']}")
                    except cloudinary.exceptions.Error as e:
                        logger.error(f"Cloudinary upload failed for {image_file.filename}: {e}")
                        return {"Error": f"Image upload failed for {image_file.filename}: {str(e)}"}, 500
                else:
                    return {"Error": f"Invalid file type for {image_file.filename}."}, 400

            if not uploaded_urls:
                return {"Error": "No valid images were uploaded."}, 400

            # Create new laptop record
            category = Category.query.get_or_404(category_id)
            brand = Brand.query.get_or_404(brand_id)
            
            new_laptop = Laptop(
                name=name,
                price=price,
                description=description,
                image_urls=uploaded_urls,  # Store the Cloudinary URL
                ram=ram,
                storage=storage,
                battery=battery,
                display=display,
                processor=processor,
                os=os,
                category=category,
                brand=brand
            )
            
            db.session.add(new_laptop)
            db.session.commit()
            return {"Message": "laptop added successfully!"}, 201

        except Exception as e:
            print(f"Unexpected error: {e}")
            return {"Error": "An error occurred while adding the laptop", "Details": str(e)}, 500

# Single LaptopResource
class SingleLaptopResource(Resource):
    @jwt_required()
    def get(self, laptop_id):
        laptop  =Laptop.query.get_or_404(laptop_id)
        return {
            "id": laptop.id,
            "name": laptop.name,
            "price": laptop.price,
            "category": laptop.category.name,
            "brand": laptop.brand.name
        }, 200

    @jwt_required()
    @admin_required
    def put(self, laptop_id):
        data = request.get_json()
        laptop = Laptop.query.get_or_404(laptop_id)
        laptop.name = data['name']
        laptop.price = data['price']
        laptop.description = data['description']
        laptop.image_urls = ','.join(data['image_urls'])
        laptop.ram = data['ram']
        laptop.storage = data['storage']
        laptop.battery = data['battery']
        laptop.display = data['display']
        laptop.processor = data['processor']
        laptop.os = data['os']
        laptop.category_id = data['category_id']
        laptop.brand_id = data['brand_id']
        db.session.commit()
        return {"Message": "Laptop Updated Successfully!"}, 200

    @jwt_required()
    @admin_required
    def delete(self, laptop_id):
        laptop =  Laptop.query.get_or_404(laptop_id)
        db.session.delete(laptop)
        db.session.commit()
        return {"Message": "Laptop Deleted Successfully!"}, 200



# Tablet Resource   
class TabletResource(Resource):
    def get(self):
        tablet = Tablet.query.all()
        return [
            {
                "id": tablet.id,
                "name": tablet.name,
                "price": tablet.price,
                "category": tablet.category.name,
                "brand": tablet.brand.name
            }
            for tablet in tablet
        ], 200

    @jwt_required()
    @admin_required
    def post(self):
        try:
            # Access form data as dictionary
            name = request.form.get('name')
            price = request.form.get('price')
            description = request.form.get('description')
            ram = request.form.get('ram')
            storage = request.form.get('storage')
            battery = request.form.get('battery')
            main_camera = request.form.get('main_camera')
            front_camera = request.form.get('front_camera')
            display = request.form.get('display')
            processor = request.form.get('processor')
            connectivity = request.form.get('connectivity')
            colors = request.form.get('colors')
            os = request.form.get('os')
            category_id = request.form.get('category_id')
            brand_id = request.form.get('brand_id')

            image_files = request.files.getlist('image_urls')

            # Validate file types
            ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
            def allowed_file(filename):
                return '.' in filename and \
                       filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
            
            # Upload images to Cloudinary
            uploaded_urls = []
            for image_file in image_files:
                if image_file and allowed_file(image_file.filename):
                    try:
                        logger.info(f"Uploading {image_file.filename} to Cloudinary...")
                        result = cloudinary.uploader.upload(image_file)
                        uploaded_urls.append(result['secure_url'])
                        logger.info(f"Uploaded to: {result['secure_url']}")
                    except cloudinary.exceptions.Error as e:
                        logger.error(f"Cloudinary upload failed for {image_file.filename}: {e}")
                        return {"Error": f"Image upload failed for {image_file.filename}: {str(e)}"}, 500
                else:
                    return {"Error": f"Invalid file type for {image_file.filename}."}, 400

            if not uploaded_urls:
                return {"Error": "No valid images were uploaded."}, 400

            # Create new laptop record
            category = Category.query.get_or_404(category_id)
            brand = Brand.query.get_or_404(brand_id)
            # Process colors
            colors_list = [color.strip() for color in colors.split(",")]
            colors_str = ",".join(colors_list)

            new_tablet = Tablet(
                name=name,
                price=price,
                description=description,
                image_urls=uploaded_urls,  # Store the Cloudinary URL
                ram=ram,
                storage=storage,
                battery=battery,
                main_camera=main_camera,
                front_camera=front_camera,
                display=display,
                processor=processor,
                connectivity=connectivity,
                colors=colors_str,
                os=os,
                category=category,
                brand=brand
            )
            
            db.session.add(new_tablet)
            db.session.commit()
            return {"Message": "tablet added successfully!"}, 201

        except Exception as e:
            print(f"Unexpected error: {e}")
            return {"Error": "An error occurred while adding the tablet", "Details": str(e)}, 500

# Single Phone Resource
class SingleTabletResource(Resource):
    @jwt_required()
    def get(self, tablet_id):
        tablet  =Tablet.query.get_or_404(tablet_id)
        return {
            "id": tablet.id,
            "name": tablet.name,
            "price": tablet.price,
            "category": tablet.category.name,
            "brand": tablet.brand.name
        }, 200

    @jwt_required()
    @admin_required
    def put(self, tablet_id):
        data = request.get_json()
        tablet= Tablet.query.get_or_404(tablet_id)
        tablet.name = data['name']
        tablet.price = data['price']
        tablet.description = data['description']
        tablet.image_urls = ','.join(data['image_urls'])
        tablet.ram = data['ram']
        tablet.storage = data['storage']
        tablet.battery = data['battery']
        tablet.main_camera = data['main_camera']
        tablet.front_camera = data['front_camera']
        tablet.display = data['display']
        tablet.processor = data['processor']
        tablet.connectivity = data['connectivity']
        tablet.colors = ','.join(data['colors'])
        tablet.os = data['os']
        tablet.category_id = data['category_id']
        tablet.brand_id = data['brand_id']
        db.session.commit()
        return {"Message": "tablet Updated Successfully!"}, 200

    @jwt_required()
    @admin_required
    def delete(self, tablet_id):
        tablet =  Tablet.query.get_or_404(tablet_id)
        db.session.delete(tablet)
        db.session.commit()
        return {"Message": "tablet Deleted Successfully!"}, 200


#Audio
class AudioResource(Resource):
    def get(self):
        audio = Audio.query.all()
        return [
            {
                "id": audio.id,
                "name": audio.name,
                "price": audio.price,
                "category": audio.category.name,
                "brand": audio.brand.name
            }
            for audio in audio
        ], 200

    @jwt_required()
    @admin_required
    def post(self):
        try:
            # Access form data as dictionary
            name = request.form.get('name')
            price = request.form.get('price')
            description = request.form.get('description')
            category_id = request.form.get('category_id')
            brand_id = request.form.get('brand_id')
            
            image_files = request.files.getlist('image_urls')

            # Validate file types
            ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
            def allowed_file(filename):
                return '.' in filename and \
                       filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
            
            # Upload images to Cloudinary
            uploaded_urls = []
            for image_file in image_files:
                if image_file and allowed_file(image_file.filename):
                    try:
                        logger.info(f"Uploading {image_file.filename} to Cloudinary...")
                        result = cloudinary.uploader.upload(image_file)
                        uploaded_urls.append(result['secure_url'])
                        logger.info(f"Uploaded to: {result['secure_url']}")
                    except cloudinary.exceptions.Error as e:
                        logger.error(f"Cloudinary upload failed for {image_file.filename}: {e}")
                        return {"Error": f"Image upload failed for {image_file.filename}: {str(e)}"}, 500
                else:
                    return {"Error": f"Invalid file type for {image_file.filename}."}, 400

            if not uploaded_urls:
                return {"Error": "No valid images were uploaded."}, 400

            # Create new  Audio record
            category = Category.query.get_or_404(category_id)
            brand = Brand.query.get_or_404(brand_id)
            
            new_audio = Audio(
                name=name,
                price=price,
                description=description,
                image_urls=uploaded_urls,  # Store the Cloudinary URL
                category=category,
                brand=brand
            )
            
            db.session.add(new_audio)
            db.session.commit()
            return {"Message": "tablet added successfully!"}, 201

        except Exception as e:
            print(f"Unexpected error: {e}")
            return {"Error": "An error occurred while adding the tablet", "Details": str(e)}, 500

# Single Phone Resource
class SingleAudioResource(Resource):
    @jwt_required()
    def get(self, audio_id):
        audio  =Audio.query.get_or_404(audio_id)
        return {
            "id": audio.id,
            "name": audio.name,
            "price": audio.price,
            "category": audio.category.name,
            "brand": audio.brand.name
        }, 200

    @jwt_required()
    @admin_required
    def put(self, audio_id):
        data = request.get_json()
        audio= Audio.query.get_or_404(audio_id)
        audio.name = data['name']
        audio.price = data['price']
        audio.description = data['description']
        audio.image_urls = ','.join(data['image_urls'])
        audio.battery = data['battery']
        audio.category_id = data['category_id']
        audio.brand_id = data['brand_id']
        db.session.commit()
        return {"Message": "audio Updated Successfully!"}, 200

    @jwt_required()
    @admin_required
    def delete(self, audio_id):
        audio =  Audio.query.get_or_404(audio_id)
        db.session.delete(audio)
        db.session.commit()
        return {"Message": "audio Deleted Successfully!"}, 200



# Register all the resources with Flask-Restful
api.add_resource(SignUp, '/signup')
api.add_resource(Login, '/login')
api.add_resource(Logout, '/logout')

# Category routes
api.add_resource(CategoryResource, '/categories')
api.add_resource(SingleCategoryResource, '/categories/<int:category_id>')

# Brand routes
api.add_resource(BrandResource, '/brands')
api.add_resource(SingleBrandResource, '/brands/<int:brand_id>')

# Phone routes
api.add_resource(PhoneResource, '/phones')
api.add_resource(SinglePhoneResource, '/phones/<int:phone_id>')

# Laptop routes
api.add_resource(LaptopResource, '/laptop')
api.add_resource(SingleLaptopResource, '/laptop/<int:laptop_id>')

# tablet routes
api.add_resource(TabletResource, '/tablet')
api.add_resource(SingleTabletResource, '/tablet/<int:laptop_id>')

# Audio routes
api.add_resource(AudioResource, '/audio')
api.add_resource(SingleAudioResource, '/audio/<int:laptop_id>')


# Cart routes
api.add_resource(CartResource, '/cart')
api.add_resource(SingleCartItemResource, '/cart/<int:phone_id>')

# Order routes
api.add_resource(OrderResource, '/orders')

# Review routes
api.add_resource(ReviewResource, '/phones/<int:phone_id>/reviews')

# Wishlist routes
api.add_resource(WishlistResource, '/wishlist')

# Notifications routes
api.add_resource(NotificationResource, '/notifications')
api.add_resource(AdminNotificationResource, '/admin/notifications')

# Admin routes
api.add_resource(AdminUserManagement, '/admin/users', '/admin/users/<int:user_id>')
api.add_resource(AdminManagementResource, '/admin/admins', '/admin/admins/<int:admin_id>')
api.add_resource(AuditLogResource, '/admin/auditlogs')

# Password change route
api.add_resource(PasswordChangeResource, '/password/change')

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
