"""
E2E Test: Complete User Journey
Tests various user interactions and workflows
"""

import pytest


@pytest.mark.e2e
class TestUserJourney:
    """Test complete user interaction flows"""

    def test_browse_add_to_wishlist_then_buy(self, client, auth_headers, multiple_products):
        """
        E2E: User browses, adds to wishlist, then purchases
        1. Browse products
        2. Add to wishlist
        3. View wishlist
        4. Add from wishlist to cart
        5. Checkout
        """
        product = multiple_products[0]

        # Step 1: Browse products
        browse_response = client.get("/api/products/")
        assert browse_response.status_code == 200

        # Step 2: Add to wishlist
        wishlist_add = client.post(
            "/api/wishlist/", headers=auth_headers, json={"product_id": product.id}
        )
        assert wishlist_add.status_code == 200

        # Step 3: View wishlist
        wishlist_view = client.get("/api/wishlist/", headers=auth_headers)
        assert wishlist_view.status_code == 200
        assert len(wishlist_view.json["data"]["wishlist"]) == 1

        # Step 4: Add from wishlist to cart
        cart_add = client.post(
            "/api/cart/", headers=auth_headers, json={"productId": product.id, "quantity": 1}
        )
        assert cart_add.status_code == 201

        # Step 5: Checkout
        order_response = client.post(
            "/api/orders/",
            headers=auth_headers,
            json={
                "address": {
                    "firstName": "Wishlist",
                    "lastName": "Buyer",
                    "email": "wishlist@example.com",
                    "phone": "0767890123",
                    "city": "Thika",
                    "street": "111 Wishlist Ave",
                },
                "payment_method": "COD",
                "total_amount": product.price,
            },
        )
        assert order_response.status_code == 201

    def test_compare_products_then_buy(self, client, auth_headers, multiple_products):
        """
        E2E: Compare products before purchasing
        1. Add products to compare
        2. View comparison
        3. Choose product
        4. Add to cart
        5. Checkout
        """
        product1, product2, product3 = multiple_products[:3]

        # Step 1: Add products to compare (max 3)
        for product in [product1, product2, product3]:
            response = client.post(
                "/api/compare/", headers=auth_headers, json={"product_id": product.id}
            )
            assert response.status_code == 201

        # Step 2: View comparison
        compare_view = client.get("/api/compare/", headers=auth_headers)
        assert compare_view.status_code == 200
        assert len(compare_view.json["data"]["product_ids"]) == 3

        # Step 3: Try to add 4th product (should fail)
        response = client.post(
            "/api/compare/", headers=auth_headers, json={"product_id": multiple_products[3].id}
        )
        assert response.status_code == 400
        assert "full" in response.json["message"].lower()

        # Step 4: Choose and buy product2
        cart_response = client.post(
            "/api/cart/", headers=auth_headers, json={"productId": product2.id, "quantity": 1}
        )
        assert cart_response.status_code == 201

        # Step 5: Checkout
        order_response = client.post(
            "/api/orders/",
            headers=auth_headers,
            json={
                "address": {
                    "firstName": "Compare",
                    "lastName": "Buyer",
                    "email": "compare@example.com",
                    "phone": "0778901234",
                    "city": "Nyeri",
                    "street": "222 Compare St",
                },
                "payment_method": "COD",
                "total_amount": product2.price,
            },
        )
        assert order_response.status_code == 201

    def test_review_after_purchase(self, client, auth_headers, product, order):
        """
        E2E: User leaves review after purchase
        1. Place order (using fixture)
        2. Leave review
        3. View reviews
        4. Update review
        """
        # Step 2: Leave review
        review_response = client.post(
            f"/api/reviews/product/{product.id}",
            headers=auth_headers,
            json={"rating": 5, "comment": "Excellent product, very satisfied!"},
        )
        assert review_response.status_code == 201

        # Step 3: View reviews
        reviews_response = client.get(f"/api/reviews/product/{product.id}")
        assert reviews_response.status_code == 200
        reviews = reviews_response.json["data"]["reviews"]
        assert len(reviews) == 1
        assert reviews[0]["rating"] == 5

        # Step 4: Try to review again (should fail)
        duplicate_review = client.post(
            f"/api/reviews/product/{product.id}",
            headers=auth_headers,
            json={"rating": 4, "comment": "Changed my mind"},
        )
        assert duplicate_review.status_code == 400
        assert "already reviewed" in duplicate_review.json["message"].lower()

    def test_profile_management_flow(self, client, auth_headers, user):
        """
        E2E: User manages profile
        1. View profile
        2. Update profile
        3. View stats
        4. View orders
        """
        # Step 1: View profile
        profile_response = client.get("/api/profile/", headers=auth_headers)
        assert profile_response.status_code == 200
        assert profile_response.json["data"]["profile"]["email"] == "test@example.com"

        # Step 2: Update profile
        update_response = client.put(
            "/api/profile/",
            headers=auth_headers,
            json={"username": "updateduser", "address": "999 New Address"},
        )
        assert update_response.status_code == 200

        # Verify update
        profile_response = client.get("/api/profile/", headers=auth_headers)
        assert profile_response.json["data"]["profile"]["username"] == "updateduser"
        assert profile_response.json["data"]["profile"]["address"] == "999 New Address"

        # Step 3: View stats
        stats_response = client.get("/api/profile/stats", headers=auth_headers)
        assert stats_response.status_code == 200
        assert "order_count" in stats_response.json["data"]["stats"]

        # Step 4: View orders
        orders_response = client.get("/api/profile/orders", headers=auth_headers)
        assert orders_response.status_code == 200

    def test_guest_to_registered_transition(self, client, product):
        """
        E2E: Guest adds to cart, then creates account
        Note: This tests the flow where cart is session-based first
        """
        # As guest, try to add to cart (should require auth)
        guest_cart_response = client.post(
            "/api/cart/", json={"productId": product.id, "quantity": 1}
        )
        assert guest_cart_response.status_code == 401

        # Guest signs up
        signup_response = client.post(
            "/api/auth/signup",
            json={
                "username": "newguest",
                "email": "newguest@example.com",
                "phone_number": "0789012345",
                "password": "GuestPass123",
            },
        )
        assert signup_response.status_code == 201

        token = signup_response.json["data"]["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Now can add to cart
        cart_response = client.post(
            "/api/cart/", headers=headers, json={"productId": product.id, "quantity": 1}
        )
        assert cart_response.status_code == 201
