from flask import Flask, request
from flask_restful import Resource, Api
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, JWTManager
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from datetime import timedelta
from models import db, User, Admin, Category, Brand, Phone, Cart, CartItem, Order, OrderItem, Review, WishList, Notification, AuditLog

# Initialize Flask app
app = Flask(__name__)

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

blacklisted_tokens = set()

class SignUp(Resource):
    def post(self):
        try:
            data = request.get_json()
            print(f"Received data: {data}")  # Debug print statement

            # Extracting fields from the request data
            username = data.get('username')
            email = data.get('email')
            phone_number = data.get('phone_number')
            address = data.get('address')
            password = data.get('password')

            # Ensure all required fields are present
            if not all([username, email, phone_number, address, password]):
                return {"Error": "Missing required fields"}, 400

            # Check if username or email already exists
            if User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first():
                return {"Error": "Username or Email Already Exists"}, 401

            # Create a new user
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

        except KeyError as e:
            return {"Error": f"Missing field: {str(e)}"}, 400
        except Exception as e:
            print(f"Error during signup: {str(e)}")  # Debug print statement
            return {"Error": "Internal Server Error"}, 500

class Login(Resource):
    def post(self):
        data = request.get_json()
        email = data['email']
        password = data['password']

        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password_hash, password):
            token = create_access_token(
                identity=user.id, 
                expires_delta=timedelta(days=2)
            )

            blacklisted_tokens.clear()
            return {"Message": "Login Successful!", "token": token}, 200
        else:
            return {"Error": "Invalid Email or Password!"}, 401

class Logout(Resource):
    @jwt_required()
    def delete(self):
        current_user = get_jwt_identity()
        blacklisted_tokens.add(current_user)
        return {"Message": "Logout Successful!"}, 200

class CategoryResource(Resource):
    def get(self):
        categories = Category.query.all()
        return [{"id": category.id, "name": category.name} for category in categories], 200

    def post(self):
        data = request.get_json()
        new_category = Category(name=data['name'])
        db.session.add(new_category)
        db.session.commit()
        return {"Message": "Category Created Successfully!"}, 201

class SingleCategoryResource(Resource):
    def get(self, category_id):
        category = Category.query.get_or_404(category_id)
        return {"id": category.id, "name": category.name}, 200

    def put(self, category_id):
        data = request.get_json()
        category = Category.query.get_or_404(category_id)
        category.name = data['name']
        db.session.commit()
        return {"Message": "Category Updated Successfully!"}, 200

    def delete(self, category_id):
        category = Category.query.get_or_404(category_id)
        db.session.delete(category)
        db.session.commit()
        return {"Message": "Category Deleted Successfully!"}, 200


class PhoneResource(Resource):
    def get(self):
        phones = Phone.query.all()
        return [
            {
                "id": phone.id,
                "name": phone.name,
                "price": phone.price,
                "category": phone.category.name
            }
            for phone in phones
        ], 200

    def post(self):
        data = request.get_json()
        category = Category.query.get_or_404(data['category_id'])
        new_phone = Phone(
            name=data['name'],
            price=data['price'],
            category=category
        )
        db.session.add(new_phone)
        db.session.commit()
        return {"Message": "Phone Added Successfully!"}, 201

class SinglePhoneResource(Resource):
    def get(self, phone_id):
        phone = Phone.query.get_or_404(phone_id)
        return {
            "id": phone.id,
            "name": phone.name,
            "price": phone.price,
            "category": phone.category.name
        }, 200

    def put(self, phone_id):
        data = request.get_json()
        phone = Phone.query.get_or_404(phone_id)
        phone.name = data['name']
        phone.price = data['price']
        phone.category_id = data['category_id']
        db.session.commit()
        return {"Message": "Phone Updated Successfully!"}, 200

    def delete(self, phone_id):
        phone = Phone.query.get_or_404(phone_id)
        db.session.delete(phone)
        db.session.commit()
        return {"Message": "Phone Deleted Successfully!"}, 200


class CartResource(Resource):
    @jwt_required()
    def get(self):
        current_user_id = get_jwt_identity()
        cart = Cart.query.filter_by(user_id=current_user_id).first()
        if not cart:
            return {"Message": "Cart is Empty"}, 200
        return [
            {
                "phone_id": item.phone_id,
                "quantity": item.quantity,
                "price": item.phone.price
            }
            for item in cart.items
        ], 200

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
        cart_item = CartItem.query.filter_by(cart_id=cart.id, phone_id=data['phone_id']).first()
        if cart_item:
            cart_item.quantity += data['quantity']
        else:
            cart_item = CartItem(
                cart_id=cart.id,
                phone_id=data['phone_id'],
                quantity=data['quantity']
            )
            db.session.add(cart_item)
        db.session.commit()
        return {"Message": "Item Added to Cart!"}, 201

class SingleCartItemResource(Resource):
    @jwt_required()
    def delete(self, phone_id):
        current_user_id = get_jwt_identity()
        cart = Cart.query.filter_by(user_id=current_user_id).first_or_404()
        cart_item = CartItem.query.filter_by(cart_id=cart.id, phone_id=phone_id).first_or_404()
        db.session.delete(cart_item)
        db.session.commit()
        return {"Message": "Item Removed from Cart!"}, 200


class OrderResource(Resource):
    @jwt_required()
    def post(self):
        current_user_id = get_jwt_identity()
        cart = Cart.query.filter_by(user_id=current_user_id).first_or_404()
        if not cart.items:
            return {"Message": "Cart is Empty"}, 400

        order = Order(user_id=current_user_id)
        db.session.add(order)
        db.session.commit()

        for item in cart.items:
            order_item = OrderItem(
                order_id=order.id,
                phone_id=item.phone_id,
                quantity=item.quantity
            )
            db.session.add(order_item)
        db.session.commit()

        # Clear the cart after placing the order
        db.session.delete(cart)
        db.session.commit()

        return {"Message": "Order Placed Successfully!"}, 201

    @jwt_required()
    def get(self):
        current_user_id = get_jwt_identity()
        orders = Order.query.filter_by(user_id=current_user_id).all()
        return [
            {
                "order_id": order.id,
                "phones": [
                    {
                        "phone_id": item.phone_id,
                        "quantity": item.quantity,
                        "price": item.phone.price
                    }
                    for item in order.items
                ]
            }
            for order in orders
        ], 200


class ReviewResource(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json()
        current_user_id = get_jwt_identity()
        phone = Phone.query.get_or_404(data['phone_id'])

        new_review = Review(
            phone_id=phone.id,
            user_id=current_user_id,
            rating=data['rating'],
            comment=data['comment']
        )
        db.session.add(new_review)
        db.session.commit()
        return {"Message": "Review Submitted Successfully!"}, 201

    def get(self, phone_id):
        reviews = Review.query.filter_by(phone_id=phone_id).all()
        return [
            {
                "user_id": review.user_id,
                "rating": review.rating,
                "comment": review.comment
            }
            for review in reviews
        ], 200

class WishListResource(Resource):
    @jwt_required()
    def get(self):
        current_user_id = get_jwt_identity()
        wishlist = WishList.query.filter_by(user_id=current_user_id).all()
        return [
            {"phone_id": item.phone.id, "name": item.phone.name, "price": item.phone.price}
            for item in wishlist
        ], 200

    @jwt_required()
    def post(self):
        current_user_id = get_jwt_identity()
        data = request.get_json()
        phone = Phone.query.get_or_404(data['phone_id'])
        
        wishlist_item = WishList.query.filter_by(user_id=current_user_id, phone_id=phone.id).first()
        if wishlist_item:
            return {"Error": "Phone already in wishlist"}, 400

        new_wishlist_item = WishList(user_id=current_user_id, phone_id=phone.id)
        db.session.add(new_wishlist_item)
        db.session.commit()
        return {"Message": "Phone added to wishlist"}, 201

    @jwt_required()
    def delete(self, phone_id):
        current_user_id = get_jwt_identity()
        wishlist_item = WishList.query.filter_by(user_id=current_user_id, phone_id=phone_id).first_or_404()
        db.session.delete(wishlist_item)
        db.session.commit()
        return {"Message": "Phone removed from wishlist"}, 200


class NotificationResource(Resource):
    @jwt_required()
    def get(self):
        current_user_id = get_jwt_identity()
        notifications = Notification.query.filter_by(user_id=current_user_id).all()
        return [
            {"id": notification.id, "message": notification.message, "is_read": notification.is_read}
            for notification in notifications
        ], 200

    @jwt_required()
    def post(self):
        data = request.get_json()
        new_notification = Notification(
            user_id=data['user_id'],
            message=data['message'],
            is_read=False  # Set to False by default
        )
        db.session.add(new_notification)
        db.session.commit()
        return {"Message": "Notification created successfully"}, 201

    @jwt_required()
    def put(self, notification_id):
        notification = Notification.query.get_or_404(notification_id)
        notification.is_read = True
        db.session.commit()
        return {"Message": "Notification marked as read"}, 200


class AuditLogResource(Resource):
    @jwt_required()
    def get(self):
        logs = AuditLog.query.all()
        return [
            {
                "id": log.id,
                "action": log.action,
                "timestamp": log.timestamp,
                "admin_id": log.admin_id
            }
            for log in logs
        ], 200

def admin_required(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        current_user_id = get_jwt_identity()
        admin = Admin.query.get(current_user_id)
        if not admin:
            return {"Error": "Admin privileges required"}, 403
        return f(*args, **kwargs)
    return decorator



# Add Resources to the API
api.add_resource(SignUp, '/signup')
api.add_resource(Login, '/login')
api.add_resource(Logout, '/logout')

# Category routes
api.add_resource(CategoryResource, '/categories')
api.add_resource(SingleCategoryResource, '/categories/<int:category_id>')

# Phone routes
api.add_resource(PhoneResource, '/phones')
api.add_resource(SinglePhoneResource, '/phones/<int:phone_id>')

# Cart routes
api.add_resource(CartResource, '/cart')
api.add_resource(SingleCartItemResource, '/cart/<int:phone_id>')

# Order routes
api.add_resource(OrderResource, '/orders')

# Review routes
# api.add_resource(ReviewResource, '/reviews')
api.add_resource(ReviewResource, '/reviews/<int:phone_id>')


if __name__ == '__main__':
    app.run(debug=True)
