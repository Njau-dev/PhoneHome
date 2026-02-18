"""E2E failure scenarios covering auth, checkout, payments, compare, and wishlist."""

from datetime import datetime, timedelta

import pytest

from app.models import Cart, Compare, CompareItem, Order, Payment, User, WishList


@pytest.mark.e2e
class TestAuthFailureScenarios:
    def test_invalid_login_rejected(self, client, user):
        response = client.post(
            "/api/auth/login", json={"email": user.email, "password": "wrong-password"}
        )

        assert response.status_code == 400
        assert response.json["success"] is False
        assert response.json["data"] is None
        assert "invalid" in response.json["message"].lower()

    def test_expired_reset_token_rejected_and_token_not_cleared(
        self, client, db, user, monkeypatch
    ):
        class _FakeEmailService:
            def send_password_reset(self, *_args, **_kwargs):
                return {"success": True}

        monkeypatch.setattr(
            "app.api.auth.routes.EmailService.init_app", lambda _app: _FakeEmailService()
        )

        forgot_response = client.post("/api/auth/forgot-password", json={"email": user.email})
        assert forgot_response.status_code == 200

        db_user = User.query.get(user.id)
        assert db_user.reset_token is not None
        db_user.reset_token_expiration = datetime.utcnow() - timedelta(minutes=1)
        db.session.commit()

        reset_response = client.post(
            f"/api/auth/reset-password/{db_user.reset_token}", json={"password": "newPassword123"}
        )

        assert reset_response.status_code == 400
        assert reset_response.json["success"] is False
        assert "expired" in reset_response.json["message"].lower()

        # DB boundary: expired token remains unusable and still present
        db_user = User.query.get(user.id)
        assert db_user.reset_token is not None
        assert db_user.reset_token_expiration < datetime.utcnow()

    def test_reused_reset_token_fails_after_successful_reset(self, client, user, monkeypatch):
        class _FakeEmailService:
            def send_password_reset(self, *_args, **_kwargs):
                return {"success": True}

        monkeypatch.setattr(
            "app.api.auth.routes.EmailService.init_app", lambda _app: _FakeEmailService()
        )

        forgot_response = client.post("/api/auth/forgot-password", json={"email": user.email})
        assert forgot_response.status_code == 200

        token = User.query.get(user.id).reset_token
        assert token

        first_reset = client.post(
            f"/api/auth/reset-password/{token}", json={"password": "newPassword123"}
        )
        assert first_reset.status_code == 200
        assert first_reset.json["success"] is True

        reused_reset = client.post(
            f"/api/auth/reset-password/{token}", json={"password": "anotherPass123"}
        )
        assert reused_reset.status_code == 400
        assert reused_reset.json["success"] is False
        assert "invalid reset request" in reused_reset.json["message"].lower()

        db_user = User.query.get(user.id)
        assert db_user.reset_token is None
        assert db_user.reset_token_expiration is None


@pytest.mark.e2e
class TestCheckoutAndOrderFailureScenarios:
    def test_empty_cart_checkout_fails_with_no_order_or_payment(
        self, client, db, auth_headers, user
    ):
        response = client.post(
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

        assert response.status_code == 400
        assert response.json["success"] is False
        assert response.json["data"] is None
        assert "empty" in response.json["message"].lower()

        assert Order.query.filter_by(user_id=user.id).count() == 0
        assert Payment.query.count() == 0
        assert Cart.query.filter_by(user_id=user.id).first() is None

    def test_checkout_rejects_mismatched_total_and_preserves_cart(
        self, client, db, auth_headers, user, product
    ):
        add_cart = client.post(
            "/api/cart/", headers=auth_headers, json={"productId": product.id, "quantity": 1}
        )
        assert add_cart.status_code == 201

        response = client.post(
            "/api/orders/",
            headers=auth_headers,
            json={
                "address": {
                    "firstName": "Mismatch",
                    "lastName": "Total",
                    "email": "mismatch@example.com",
                    "phone": "0712000000",
                    "city": "Nairobi",
                    "street": "1 Total Lane",
                },
                "payment_method": "COD",
                "total_amount": float(product.price) + 1,
            },
        )

        assert response.status_code == 400
        assert response.json["success"] is False
        assert "does not match cart total" in response.json["message"].lower()

        assert Order.query.filter_by(user_id=user.id).count() == 0
        assert Payment.query.count() == 0
        cart = Cart.query.filter_by(user_id=user.id).first()
        assert cart is not None
        assert len(cart.items) == 1

    def test_checkout_rejects_invalid_address_fields(self, client, db, auth_headers, user, product):
        client.post(
            "/api/cart/", headers=auth_headers, json={"productId": product.id, "quantity": 1}
        )

        response = client.post(
            "/api/orders/",
            headers=auth_headers,
            json={
                "address": {
                    "firstName": "Address",
                    "lastName": "",
                    "email": "address@example.com",
                    "phone": "0712111111",
                    "city": "Nairobi",
                },
                "payment_method": "COD",
                "total_amount": float(product.price),
            },
        )

        assert response.status_code == 400
        assert response.json["success"] is False
        assert "invalid address" in response.json["message"].lower()

        assert Order.query.filter_by(user_id=user.id).count() == 0
        cart = Cart.query.filter_by(user_id=user.id).first()
        assert cart is not None and len(cart.items) == 1

    def test_canceled_order_path_blocks_further_payment_retry(
        self, client, db, auth_headers, admin_user, user, product
    ):
        client.post(
            "/api/cart/", headers=auth_headers, json={"productId": product.id, "quantity": 1}
        )
        admin_login = client.post(
            "/api/auth/admin/login", json={"email": admin_user.email, "password": "admin123"}
        )
        admin_headers = {"Authorization": f"Bearer {admin_login.json['data']['access_token']}"}

        order_response = client.post(
            "/api/payments/mpesa/initiate",
            headers=auth_headers,
            json={
                "phone_number": "254712345678",
                "total_amount": float(product.price),
                "address": {
                    "firstName": "Cancel",
                    "lastName": "Flow",
                    "email": "cancel@example.com",
                    "phone": "0712333444",
                    "city": "Nairobi",
                    "street": "77 Flow Street",
                },
            },
        )
        assert order_response.status_code in [201, 400, 500]

        # If initiation failed due gateway, get order created before STK push and continue path.
        order = Order.query.filter_by(user_id=user.id).first()
        if not order:
            pytest.skip("Order not created due mpesa gateway constraints in test environment")

        cancel_response = client.put(
            f"/api/orders/status/{order.id}", headers=admin_headers, json={"status": "Canceled"}
        )
        assert cancel_response.status_code == 200
        assert cancel_response.json["success"] is True

        retry_response = client.post(
            "/api/payments/mpesa/retry",
            headers=auth_headers,
            json={"phone_number": "254712345678", "order_reference": order.order_reference},
        )
        assert retry_response.status_code == 400
        assert retry_response.json["success"] is False
        assert "cannot be retried" in retry_response.json["message"].lower()

        db_order = Order.query.get(order.id)
        assert db_order.status == "Canceled"

    def test_user_cannot_read_other_user_order(self, client, create_user, product):
        user_a = create_user(username="alice", email="alice@example.com", phone_number="0700000001")
        user_b = create_user(username="bob", email="bob@example.com", phone_number="0700000002")

        login_a = client.post(
            "/api/auth/login", json={"email": user_a.email, "password": "password123"}
        )
        login_b = client.post(
            "/api/auth/login", json={"email": user_b.email, "password": "password123"}
        )
        headers_a = {"Authorization": f"Bearer {login_a.json['data']['token']}"}
        headers_b = {"Authorization": f"Bearer {login_b.json['data']['token']}"}

        client.post("/api/cart/", headers=headers_a, json={"productId": product.id, "quantity": 1})
        create_order = client.post(
            "/api/orders/",
            headers=headers_a,
            json={
                "address": {
                    "firstName": "Alice",
                    "lastName": "A",
                    "email": "alice@example.com",
                    "phone": "0700000001",
                    "city": "Nairobi",
                    "street": "A Street",
                },
                "payment_method": "COD",
                "total_amount": float(product.price),
            },
        )
        assert create_order.status_code == 201
        order_reference = create_order.json["data"]["order_reference"]

        forbidden_read = client.get(f"/api/orders/{order_reference}", headers=headers_b)
        assert forbidden_read.status_code == 404
        assert forbidden_read.json["success"] is False


@pytest.mark.e2e
class TestPaymentLifecycleFailureScenarios:
    def test_callback_missing_fields_rejected_with_no_state_change(self, client, payment):
        payment.checkout_request_id = "ws_CO_12345"

        response = client.post("/api/payments/ganji/inaflow", json={"Body": {"stkCallback": {}}})

        assert response.status_code == 400
        assert response.json["success"] is False
        assert response.json["data"]["ResultCode"] == 1

        db_payment = Payment.query.get(payment.id)
        assert db_payment.status == "Pending"

    def test_failed_mpesa_result_code_updates_order_and_payment(self, client, db, user, product):
        # Build MPESA order/payment baseline
        order = Order(
            user_id=user.id,
            order_reference="PHK-900",
            total_amount=float(product.price),
            status="Pending Payment",
        )
        payment = Payment(
            order_reference="PHK-900",
            amount=float(product.price),
            payment_method="MPESA",
            status="Pending",
            checkout_request_id="ws_CO_900",
        )
        db.session.add(payment)
        db.session.flush()
        order.payment_id = payment.id
        db.session.add(order)
        db.session.commit()

        callback = client.post(
            "/api/payments/ganji/inaflow",
            json={
                "Body": {
                    "stkCallback": {
                        "CheckoutRequestID": "ws_CO_900",
                        "ResultCode": 1032,
                        "ResultDesc": "Request cancelled by user",
                    }
                }
            },
        )

        assert callback.status_code == 200
        assert callback.json["success"] is True
        assert callback.json["data"]["message"] == "Callback processed successfully"

        db_order = Order.query.filter_by(order_reference="PHK-900").first()
        db_payment = Payment.query.filter_by(order_reference="PHK-900").first()
        assert db_order.status == "Payment Failed"
        assert db_payment.status == "Failed"
        assert db_payment.result_code == "1032"

    def test_payment_retry_security_and_retry_limit_by_state(
        self, client, db, create_user, product
    ):
        user_a = create_user(username="pay-a", email="pay-a@example.com", phone_number="0701000001")
        user_b = create_user(username="pay-b", email="pay-b@example.com", phone_number="0701000002")

        login_a = client.post(
            "/api/auth/login", json={"email": user_a.email, "password": "password123"}
        )
        login_b = client.post(
            "/api/auth/login", json={"email": user_b.email, "password": "password123"}
        )
        headers_a = {"Authorization": f"Bearer {login_a.json['data']['token']}"}
        headers_b = {"Authorization": f"Bearer {login_b.json['data']['token']}"}

        payment = Payment(
            order_reference="PHK-901",
            amount=float(product.price),
            payment_method="MPESA",
            status="Failed",
        )
        db.session.add(payment)
        db.session.flush()
        order = Order(
            user_id=user_a.id,
            order_reference="PHK-901",
            total_amount=float(product.price),
            status="Delivered",
            payment_id=payment.id,
        )
        db.session.add(order)
        db.session.commit()

        forbidden_retry = client.post(
            "/api/payments/mpesa/retry",
            headers=headers_b,
            json={"phone_number": "254700000001", "order_reference": "PHK-901"},
        )
        assert forbidden_retry.status_code == 403
        assert forbidden_retry.json["success"] is False

        blocked_retry = client.post(
            "/api/payments/mpesa/retry",
            headers=headers_a,
            json={"phone_number": "254700000001", "order_reference": "PHK-901"},
        )
        assert blocked_retry.status_code == 400
        assert blocked_retry.json["success"] is False
        assert "cannot be retried" in blocked_retry.json["message"].lower()

        db_order = Order.query.filter_by(order_reference="PHK-901").first()
        assert db_order.status == "Delivered"


@pytest.mark.e2e
class TestCompareWishlistEdgeFlows:
    def test_compare_add_remove_same_product_repeatedly_and_isolated(
        self, client, db, create_user, product
    ):
        user_a = create_user(username="cmp-a", email="cmp-a@example.com", phone_number="0702000001")
        user_b = create_user(username="cmp-b", email="cmp-b@example.com", phone_number="0702000002")

        login_a = client.post(
            "/api/auth/login", json={"email": user_a.email, "password": "password123"}
        )
        login_b = client.post(
            "/api/auth/login", json={"email": user_b.email, "password": "password123"}
        )
        headers_a = {"Authorization": f"Bearer {login_a.json['data']['token']}"}
        headers_b = {"Authorization": f"Bearer {login_b.json['data']['token']}"}

        for _ in range(2):
            add_response = client.post(
                "/api/compare/", headers=headers_a, json={"product_id": product.id}
            )
            assert add_response.status_code in [200, 201]
            assert add_response.json["success"] is True

            remove_response = client.delete(f"/api/compare/{product.id}", headers=headers_a)
            assert remove_response.status_code == 200
            assert remove_response.json["success"] is True

        # Final add to ensure compare item exists only for user A
        client.post("/api/compare/", headers=headers_a, json={"product_id": product.id})

        view_a = client.get("/api/compare/", headers=headers_a)
        view_b = client.get("/api/compare/", headers=headers_b)

        assert view_a.status_code == 200
        assert view_b.status_code == 200
        assert len(view_a.json["data"]["product_ids"]) == 1
        assert view_b.json["data"]["product_ids"] == []

        compare_a = Compare.query.filter_by(user_id=user_a.id).first()
        compare_b = Compare.query.filter_by(user_id=user_b.id).first()
        assert compare_a is not None
        assert CompareItem.query.filter_by(compare_id=compare_a.id).count() == 1
        assert compare_b is None

    def test_wishlist_add_remove_same_product_repeatedly_and_isolated(
        self, client, db, create_user, product
    ):
        user_a = create_user(
            username="wish-a", email="wish-a@example.com", phone_number="0703000001"
        )
        user_b = create_user(
            username="wish-b", email="wish-b@example.com", phone_number="0703000002"
        )

        login_a = client.post(
            "/api/auth/login", json={"email": user_a.email, "password": "password123"}
        )
        login_b = client.post(
            "/api/auth/login", json={"email": user_b.email, "password": "password123"}
        )
        headers_a = {"Authorization": f"Bearer {login_a.json['data']['token']}"}
        headers_b = {"Authorization": f"Bearer {login_b.json['data']['token']}"}

        for _ in range(2):
            add_response = client.post(
                "/api/wishlist/", headers=headers_a, json={"product_id": product.id}
            )
            assert add_response.status_code in [200, 201]
            assert add_response.json["success"] is True

            remove_response = client.delete(f"/api/wishlist/{product.id}", headers=headers_a)
            assert remove_response.status_code == 200
            assert remove_response.json["success"] is True

        client.post("/api/wishlist/", headers=headers_a, json={"product_id": product.id})

        view_a = client.get("/api/wishlist/", headers=headers_a)
        view_b = client.get("/api/wishlist/", headers=headers_b)

        assert view_a.status_code == 200
        assert view_b.status_code == 200
        assert len(view_a.json["data"]["wishlist"]) == 1
        assert view_b.json["data"]["wishlist"] == []

        wishlist_a = WishList.query.filter_by(user_id=user_a.id).first()
        wishlist_b = WishList.query.filter_by(user_id=user_b.id).first()
        assert wishlist_a is not None
        assert len(wishlist_a.products) == 1
        assert wishlist_b is not None
        assert len(wishlist_b.products) == 0
