"""
Pytest fixtures for testing
Provides shared test setup and utilities
"""

import os

import pytest
from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db as _db
from app.models import (
    Address,
    Admin,
    Brand,
    Cart,
    CartItem,
    Category,
    Compare,
    CompareItem,
    Order,
    OrderItem,
    Payment,
    Phone,
    Review,
    User,
    WishList,
)


@pytest.fixture(scope="session")
def app():
    """Create application for testing session"""
    # Set testing environment
    os.environ["FLASK_ENV"] = "testing"
    os.environ.setdefault("SECRET_KEY", "test-secret-key")
    os.environ.setdefault("FRONTEND_URL", "http://localhost:3000")
    os.environ.setdefault("MPESA_CONSUMER_KEY", "test")
    os.environ.setdefault("MPESA_CONSUMER_SECRET", "test")
    os.environ.setdefault("MPESA_BUSINESS_SHORTCODE", "123456")
    os.environ.setdefault("MPESA_PASSKEY", "passkey")

    app = create_app("testing")

    return app


@pytest.fixture(scope="function")
def db(app):
    """Create clean database for each test"""
    with app.app_context():
        _db.create_all()
        yield _db
        _db.session.remove()
        _db.drop_all()


@pytest.fixture
def client(app, db):
    """Test client for making requests"""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Test CLI runner"""
    return app.test_cli_runner()


# ============================================================================
# USER FIXTURES
# ============================================================================


@pytest.fixture
def user(db):
    """Create a test user"""
    user = User(
        username="testuser",
        email="test@example.com",
        phone_number="0712345678",
        password_hash=generate_password_hash("password123"),
        role="user",
    )
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def admin_user(db):
    """Create a test admin user"""
    admin = User(
        username="admin",
        email="admin@example.com",
        phone_number="0712345679",
        password_hash=generate_password_hash("admin123"),
        role="admin",
    )
    db.session.add(admin)
    db.session.commit()

    # Also create Admin record
    admin_record = Admin(
        id=admin.id,
        username="admin",
        email="admin@example.com",
        password_hash=generate_password_hash("admin123"),
    )
    db.session.add(admin_record)
    db.session.commit()

    return admin


@pytest.fixture
def auth_token(client, user):
    """Get JWT token for test user"""
    response = client.post(
        "/api/auth/login", json={"email": "test@example.com", "password": "password123"}
    )
    return response.json["data"]["token"]


@pytest.fixture
def auth_headers(auth_token):
    """Get authorization headers with JWT token"""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
def admin_token(client, admin_user):
    """Get JWT token for admin user"""
    response = client.post(
        "/api/auth/login", json={"email": "admin@example.com", "password": "admin123"}
    )
    return response.json["data"]["token"]


@pytest.fixture
def admin_headers(admin_token):
    """Get authorization headers for admin"""
    return {"Authorization": f"Bearer {admin_token}"}


# ============================================================================
# PRODUCT FIXTURES
# ============================================================================


@pytest.fixture
def category(db):
    """Create a test category"""
    category = Category(name="Phone")
    db.session.add(category)
    db.session.commit()
    return category


@pytest.fixture
def brand(db, category):
    """Create a test brand"""
    brand = Brand(name="Apple")
    brand.categories.append(category)
    db.session.add(brand)
    db.session.commit()
    return brand


@pytest.fixture
def product(db, category, brand):
    """Create a test phone product"""
    product = Phone(
        name="iPhone 15",
        price=120000.00,
        description="Latest iPhone model",
        image_urls=["https://example.com/iphone15.jpg"],
        category_id=category.id,
        brand_id=brand.id,
        ram="8GB",
        storage="256GB",
        battery="3000mAh",
        main_camera="48MP",
        front_camera="12MP",
        display="6.1 inch",
        processor="A17 Pro",
        connectivity="5G",
        colors="Black, White",
        os="iOS 17",
        hasVariation=False,
        isBestSeller=True,
    )
    db.session.add(product)
    db.session.commit()
    return product


@pytest.fixture
def product_with_variation(db, category, brand):
    """Create a product with variations"""
    from app.models import ProductVariation

    product = Phone(
        name="Samsung Galaxy S24",
        price=100000.00,
        description="Latest Samsung flagship",
        image_urls=["https://example.com/s24.jpg"],
        category_id=category.id,
        brand_id=brand.id,
        ram="8GB",
        storage="256GB",
        battery="4000mAh",
        main_camera="50MP",
        front_camera="12MP",
        display="6.2 inch",
        processor="Snapdragon 8 Gen 3",
        connectivity="5G",
        colors="Black, Blue",
        os="Android 14",
        hasVariation=True,
        isBestSeller=False,
    )
    db.session.add(product)
    db.session.flush()

    # Add variations
    variation1 = ProductVariation(
        product_id=product.id, ram="8GB", storage="256GB", price=100000.00
    )
    variation2 = ProductVariation(
        product_id=product.id, ram="12GB", storage="512GB", price=120000.00
    )
    db.session.add_all([variation1, variation2])
    db.session.commit()

    return product


@pytest.fixture
def multiple_products(db, category, brand):
    """Create multiple products for testing lists"""
    products = []
    for i in range(5):
        product = Phone(
            name=f"Test Phone {i}",
            price=50000.00 + (i * 10000),
            description=f"Test phone number {i}",
            image_urls=[f"https://example.com/phone{i}.jpg"],
            category_id=category.id,
            brand_id=brand.id,
            ram="8GB",
            storage="128GB",
            battery="4000mAh",
            main_camera="48MP",
            front_camera="12MP",
            display="6.1 inch",
            processor="Test Processor",
            connectivity="5G",
            colors="Black",
            os="Test OS",
            isBestSeller=i % 2 == 0,  # Every other is bestseller
        )
        products.append(product)

    db.session.add_all(products)
    db.session.commit()
    return products


# ============================================================================
# CART FIXTURES
# ============================================================================


@pytest.fixture
def cart(db, user):
    """Create a cart for test user"""
    cart = Cart(user_id=user.id)
    db.session.add(cart)
    db.session.commit()
    return cart


@pytest.fixture
def cart_with_items(db, cart, product, multiple_products):
    """Create cart with items"""
    # Add main product
    item1 = CartItem(cart_id=cart.id, product_id=product.id, quantity=2)

    # Add one from multiple products
    item2 = CartItem(cart_id=cart.id, product_id=multiple_products[0].id, quantity=1)

    db.session.add_all([item1, item2])
    db.session.commit()
    return cart


# ============================================================================
# ORDER FIXTURES
# ============================================================================


@pytest.fixture
def address(db, user):
    """Create a test address"""
    address = Address(
        user_id=user.id,
        first_name="John",
        last_name="Doe",
        email="john@example.com",
        phone="0712345678",
        city="Nairobi",
        street="123 Test Street",
        additional_info="Near Test Landmark",
    )
    db.session.add(address)
    db.session.commit()
    return address


@pytest.fixture
def payment(db):
    """Create a test payment"""
    payment = Payment(
        order_reference="PHK-001", amount=120000.00, payment_method="COD", status="Pending"
    )
    db.session.add(payment)
    db.session.commit()
    return payment


@pytest.fixture
def order(db, user, address, payment, product):
    """Create a test order"""
    order = Order(
        user_id=user.id,
        order_reference="PHK-001",
        address_id=address.id,
        payment_id=payment.id,
        total_amount=240000.00,
        status="Order Placed",
    )
    db.session.add(order)
    db.session.flush()

    # Add order item
    order_item = OrderItem(order_id=order.id, product_id=product.id, quantity=2)
    db.session.add(order_item)
    db.session.commit()

    return order


# ============================================================================
# WISHLIST & REVIEW FIXTURES
# ============================================================================


@pytest.fixture
def wishlist(db, user, product):
    """Create wishlist with product"""
    wishlist = WishList(user_id=user.id)
    wishlist.products.append(product)
    db.session.add(wishlist)
    db.session.commit()
    return wishlist


@pytest.fixture
def review(db, user, product):
    """Create a test review"""
    review = Review(user_id=user.id, product_id=product.id, rating=5, comment="Excellent product!")
    db.session.add(review)
    db.session.commit()
    return review


@pytest.fixture
def compare_list(db, user, product, multiple_products):
    """Create compare list with products"""
    compare = Compare(user_id=user.id)
    db.session.add(compare)
    db.session.flush()

    # Add 2 products to compare
    item1 = CompareItem(compare_id=compare.id, product_id=product.id)
    item2 = CompareItem(compare_id=compare.id, product_id=multiple_products[0].id)

    db.session.add_all([item1, item2])
    db.session.commit()
    return compare


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================


@pytest.fixture
def create_user(db):
    """Factory function to create users dynamically"""

    def _create_user(username="testuser", email="test@example.com", **kwargs):
        user = User(
            username=username,
            email=email,
            phone_number=kwargs.get("phone_number", "0712345678"),
            password_hash=generate_password_hash(kwargs.get("password", "password123")),
            role=kwargs.get("role", "user"),
        )
        db.session.add(user)
        db.session.commit()
        return user

    return _create_user


@pytest.fixture
def create_product(db, category, brand):
    """Factory function to create products dynamically"""

    def _create_product(name="Test Product", price=50000, **kwargs):
        product = Phone(
            name=name,
            price=price,
            description=kwargs.get("description", "Test description"),
            image_urls=kwargs.get("image_urls", ["https://example.com/test.jpg"]),
            category_id=category.id,
            brand_id=brand.id,
            ram="8GB",
            storage="128GB",
            battery="4000mAh",
            main_camera="48MP",
            front_camera="12MP",
            display="6.1 inch",
            processor="Test",
            connectivity="5G",
            colors="Black",
            os="Test OS",
        )
        db.session.add(product)
        db.session.commit()
        return product

    return _create_product
