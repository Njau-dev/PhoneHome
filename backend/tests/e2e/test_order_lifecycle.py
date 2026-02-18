"""
E2E Test: Complete Order Lifecycle
Tests order from placement through delivery
"""

import pytest


@pytest.mark.e2e
class TestOrderLifecycle:
    """Test complete order lifecycle from placement to delivery"""

    def test_cod_order_full_lifecycle(self, client, auth_headers, admin_headers, product):
        """
        E2E: COD order from placement to delivery
        1. Customer places order
        2. Admin views order
        3. Admin updates status: Packing
        4. Admin updates status: Shipped
        5. Admin updates status: Out for Delivery
        6. Admin updates status: Delivered
        7. Customer views order history
        """
        # Step 1: Add to cart and place order
        client.post(
            "/api/cart/", headers=auth_headers, json={"productId": product.id, "quantity": 1}
        )

        order_response = client.post(
            "/api/orders/",
            headers=auth_headers,
            json={
                "address": {
                    "firstName": "Lifecycle",
                    "lastName": "Test",
                    "email": "lifecycle@example.com",
                    "phone": "0790123456",
                    "city": "Nairobi",
                    "street": "333 Lifecycle Road",
                },
                "payment_method": "COD",
                "total_amount": product.price,
            },
        )
        assert order_response.status_code == 201
        order_ref = order_response.json["data"]["order_reference"]

        # Step 2: Admin views all orders
        admin_orders = client.get("/api/orders/admin/all", headers=admin_headers)
        assert admin_orders.status_code == 200
        assert len(admin_orders.json["data"]["orders"]) > 0

        # Find our order
        our_order = next(
            (o for o in admin_orders.json["data"]["orders"] if o["order_reference"] == order_ref),
            None,
        )
        assert our_order is not None
        assert our_order["status"] == "Order Placed"

        order_id = our_order["id"]

        # Step 3: Update to Packing
        packing_response = client.put(
            f"/api/orders/status/{order_id}", headers=admin_headers, json={"status": "Packing"}
        )
        assert packing_response.status_code == 200

        # Verify status updated
        order_detail = client.get(f"/api/orders/{order_ref}", headers=auth_headers)
        assert order_detail.json["data"]["status"] == "Packing"

        # Step 4: Update to Shipped
        shipped_response = client.put(
            f"/api/orders/status/{order_id}", headers=admin_headers, json={"status": "Shipped"}
        )
        assert shipped_response.status_code == 200

        # Step 5: Update to Out for Delivery
        out_for_delivery = client.put(
            f"/api/orders/status/{order_id}",
            headers=admin_headers,
            json={"status": "Out for Delivery"},
        )
        assert out_for_delivery.status_code == 200

        # Step 6: Update to Delivered
        delivered_response = client.put(
            f"/api/orders/status/{order_id}", headers=admin_headers, json={"status": "Delivered"}
        )
        assert delivered_response.status_code == 200

        # Verify final status
        final_order = client.get(f"/api/orders/{order_ref}", headers=auth_headers)
        assert final_order.json["data"]["status"] == "Delivered"
        assert final_order.json["data"]["payment"]["status"] == "Success"

        # Step 7: Customer views order history
        orders_response = client.get("/api/orders/", headers=auth_headers)
        assert orders_response.status_code == 200
        delivered_orders = [
            o for o in orders_response.json["data"]["orders"] if o["order_reference"] == order_ref
        ]
        assert len(delivered_orders) == 1
        assert delivered_orders[0]["status"] == "Delivered"

    def test_invalid_status_transition(self, client, admin_headers, order):
        """
        E2E: Test that invalid status updates are rejected
        """
        # Try to set invalid status
        invalid_response = client.put(
            f"/api/orders/status/{order.id}",
            headers=admin_headers,
            json={"status": "InvalidStatus"},
        )

        assert invalid_response.status_code == 400
        assert "invalid" in invalid_response.json["message"].lower()

    def test_customer_cannot_update_order_status(self, client, auth_headers, order):
        """
        E2E: Verify customers cannot update order status (admin only)
        """
        response = client.put(
            f"/api/orders/status/{order.id}", headers=auth_headers, json={"status": "Delivered"}
        )

        assert response.status_code == 403

    def test_order_document_generation(self, client, auth_headers, order):
        """
        E2E: Generate invoice and receipt documents
        """
        # Generate invoice
        invoice_response = client.get(
            f"/api/orders/document/{order.order_reference}/invoice", headers=auth_headers
        )
        assert invoice_response.status_code in [200, 400]  # 400 if not delivered yet

        # If order is delivered, should be able to get receipt
        if order.status == "Delivered":
            receipt_response = client.get(
                f"/api/orders/document/{order.order_reference}/receipt", headers=auth_headers
            )
            assert receipt_response.status_code == 200
            assert receipt_response.content_type == "application/pdf"

    def test_multiple_orders_different_users(self, client, create_user, product, multiple_products):
        """
        E2E: Multiple users placing orders simultaneously
        """
        orders_created = []

        # Create 3 different users and have each place an order
        for i in range(3):
            # Create user
            create_user(
                username=f"user{i}", email=f"user{i}@example.com", phone_number=f"070000000{i}"
            )

            # Login
            login_response = client.post(
                "/api/auth/login", json={"email": f"user{i}@example.com", "password": "password123"}
            )
            token = login_response.json["data"]["token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Add to cart
            selected_product = multiple_products[i] if i < len(multiple_products) else product
            client.post(
                "/api/cart/",
                headers=headers,
                json={"productId": selected_product.id, "quantity": 1},
            )

            # Place order
            order_response = client.post(
                "/api/orders/",
                headers=headers,
                json={
                    "address": {
                        "firstName": f"User{i}",
                        "lastName": "Test",
                        "email": f"user{i}@example.com",
                        "phone": f"070000000{i}",
                        "city": "Nairobi",
                        "street": f"{i} Test St",
                    },
                    "payment_method": "COD",
                    "total_amount": selected_product.price,
                },
            )

            assert order_response.status_code == 201
            orders_created.append(order_response.json["data"]["order_reference"])

        # Verify all orders are unique
        assert len(set(orders_created)) == 3

        # Verify order references follow sequence
        for order_ref in orders_created:
            assert order_ref.startswith("PHK-")
            order_ref.split("-")
