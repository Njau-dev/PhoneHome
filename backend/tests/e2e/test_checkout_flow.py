"""
E2E Test: Complete Checkout Flow
Tests the entire user journey from signup to order completion
"""

import pytest


@pytest.mark.e2e
class TestCompleteCheckoutFlow:
    """Test complete checkout process"""

    def test_guest_to_checkout_flow(self, client, product):
        """
        E2E: Complete flow for new user
        1. Signup
        2. Browse products
        3. Add to cart
        4. Checkout
        5. Place order
        """
        # Step 1: User signs up
        signup_response = client.post(
            "/api/auth/signup",
            json={
                "username": "newuser",
                "email": "newuser@example.com",
                "phone_number": "0723456789",
                "password": "SecurePass123",
            },
        )

        assert signup_response.status_code == 201
        assert "token" in signup_response.json["data"]

        token = signup_response.json["data"]["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Step 2: Browse products
        products_response = client.get("/api/products/")
        assert products_response.status_code == 200
        assert len(products_response.json["data"]["products"]) > 0

        # Step 3: Add product to cart
        cart_response = client.post(
            "/api/cart/", headers=headers, json={"productId": product.id, "quantity": 2}
        )
        assert cart_response.status_code == 201

        # Step 4: View cart
        view_cart_response = client.get("/api/cart/", headers=headers)
        assert view_cart_response.status_code == 200
        cart_data = view_cart_response.json["data"]["cart"]
        assert str(product.id) in cart_data

        # Step 5: Place order
        order_response = client.post(
            "/api/orders/",
            headers=headers,
            json={
                "address": {
                    "firstName": "New",
                    "lastName": "User",
                    "email": "newuser@example.com",
                    "phone": "0723456789",
                    "city": "Nairobi",
                    "street": "456 New Street",
                    "additionalInfo": "Gate 2",
                },
                "payment_method": "COD",
                "total_amount": product.price * 2,
            },
        )

        assert order_response.status_code == 201
        assert "order_reference" in order_response.json["data"]
        order_ref = order_response.json["data"]["order_reference"]

        # Step 6: Verify order was created
        order_detail_response = client.get(f"/api/orders/{order_ref}", headers=headers)
        assert order_detail_response.status_code == 200
        assert order_detail_response.json["data"]["order_reference"] == order_ref
        assert order_detail_response.json["data"]["status"] == "Order Placed"

        # Step 7: Verify cart is empty
        empty_cart_response = client.get("/api/cart/", headers=headers)
        assert empty_cart_response.json["data"]["cart"] == {}

    def test_returning_user_checkout(self, client, auth_headers, product):
        """
        E2E: Returning user checkout flow
        1. Login
        2. Add to cart
        3. Update quantity
        4. Checkout
        """
        # Step 1: User already logged in (using auth_headers fixture)

        # Step 2: Add product to cart
        client.post(
            "/api/cart/", headers=auth_headers, json={"productId": product.id, "quantity": 1}
        )

        # Step 3: Update quantity
        update_response = client.put(
            "/api/cart/", headers=auth_headers, json={"productId": product.id, "quantity": 3}
        )
        assert update_response.status_code == 200

        # Step 4: Place order
        order_response = client.post(
            "/api/orders/",
            headers=auth_headers,
            json={
                "address": {
                    "firstName": "Test",
                    "lastName": "User",
                    "email": "test@example.com",
                    "phone": "0712345678",
                    "city": "Mombasa",
                    "street": "789 Beach Road",
                },
                "payment_method": "COD",
                "total_amount": product.price * 3,
            },
        )

        assert order_response.status_code == 201

    def test_multiple_items_checkout(self, client, auth_headers, multiple_products):
        """
        E2E: Checkout with multiple different products
        """
        # Add multiple products to cart
        for i, product in enumerate(multiple_products[:3]):
            response = client.post(
                "/api/cart/",
                headers=auth_headers,
                json={"productId": product.id, "quantity": i + 1},
            )
            assert response.status_code == 201

        # View cart to calculate total
        cart_response = client.get("/api/cart/", headers=auth_headers)
        cart = cart_response.json["data"]["cart"]

        # Calculate total
        total = 0
        for product in multiple_products[:3]:
            if str(product.id) in cart:
                for _variation, details in cart[str(product.id)].items():
                    total += details["price"] * details["quantity"]

        # Place order
        order_response = client.post(
            "/api/orders/",
            headers=auth_headers,
            json={
                "address": {
                    "firstName": "Multi",
                    "lastName": "Item",
                    "email": "multi@example.com",
                    "phone": "0734567890",
                    "city": "Kisumu",
                    "street": "321 Lake View",
                },
                "payment_method": "COD",
                "total_amount": total,
            },
        )

        assert order_response.status_code == 201

        # Verify order has all items
        order_ref = order_response.json["data"]["order_reference"]
        order_detail = client.get(f"/api/orders/{order_ref}", headers=auth_headers)

        items = order_detail.json["data"]["items"]
        assert len(items) == 3

    def test_product_with_variation_checkout(self, client, auth_headers, product_with_variation):
        """
        E2E: Checkout with product variation
        """
        # Add product with specific variation
        response = client.post(
            "/api/cart/",
            headers=auth_headers,
            json={
                "productId": product_with_variation.id,
                "quantity": 1,
                "selectedVariation": {"ram": "12GB", "storage": "512GB", "price": 120000.00},
            },
        )

        assert response.status_code == 201

        # Place order
        order_response = client.post(
            "/api/orders/",
            headers=auth_headers,
            json={
                "address": {
                    "firstName": "Variation",
                    "lastName": "Test",
                    "email": "variation@example.com",
                    "phone": "0745678901",
                    "city": "Eldoret",
                    "street": "654 Highlands",
                },
                "payment_method": "COD",
                "total_amount": 120000.00,
            },
        )

        assert order_response.status_code == 201

        # Verify variation in order
        order_ref = order_response.json["data"]["order_reference"]
        order_detail = client.get(f"/api/orders/{order_ref}", headers=auth_headers)

        item = order_detail.json["data"]["items"][0]
        assert item["variation_name"] == "12GB - 512GB"
        assert item["price"] == 120000.00

    def test_checkout_with_empty_cart_fails(self, client, auth_headers):
        """
        E2E: Should not allow checkout with empty cart
        """
        order_response = client.post(
            "/api/orders/",
            headers=auth_headers,
            json={
                "address": {
                    "firstName": "Empty",
                    "lastName": "Cart",
                    "email": "empty@example.com",
                    "phone": "0756789012",
                    "city": "Nakuru",
                    "street": "987 Rift Valley",
                },
                "payment_method": "COD",
                "total_amount": 0,
            },
        )

        assert order_response.status_code == 400
        assert "empty" in order_response.json["message"].lower()
