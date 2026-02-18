"""Integration tests for order document generation endpoints and helpers."""

import pytest

from app.models import Address, Order, OrderItem, Payment


def _orders_routes():
    """Lazy import order routes module to avoid import-time app-context side effects."""
    from app.api.orders import routes

    return routes


@pytest.fixture
def another_user(create_user):
    """Create a second user to validate ownership checks."""
    return create_user(
        username="otheruser",
        email="other@example.com",
        phone_number="0799999999",
        password="password123",
    )


@pytest.fixture
def another_user_headers(client, another_user):
    """Authenticated headers for second user."""
    response = client.post(
        "/api/auth/login", json={"email": "other@example.com", "password": "password123"}
    )
    token = response.json["data"]["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def detailed_order(db, user, product):
    """Create an order with complete data used by both invoice and receipt templates."""
    address = Address(
        user_id=user.id,
        first_name="John",
        last_name="Doe",
        email="john@example.com",
        phone="0712345678",
        city="Nairobi",
        street="123 Test Street",
        additional_info="Apartment 45, near community center",
    )
    db.session.add(address)
    db.session.flush()

    payment = Payment(
        order_reference="PHK-DOC-001",
        amount=165000.00,
        payment_method="MPESA",
        status="Completed",
        mpesa_receipt="QWERTY12345",
        phone_number="0712345678",
    )
    db.session.add(payment)
    db.session.flush()

    order = Order(
        user_id=user.id,
        order_reference="PHK-DOC-001",
        address_id=address.id,
        payment_id=payment.id,
        total_amount=165000.00,
        status="Delivered",
    )
    db.session.add(order)
    db.session.flush()

    item = OrderItem(
        order_id=order.id,
        product_id=product.id,
        quantity=1,
        variation_name="8GB / 256GB",
        variation_price=165000,
    )
    db.session.add(item)
    db.session.commit()

    return order


def test_generate_document_invoice_success(client, auth_headers, detailed_order):
    """Should generate invoice PDF for owner with a non-empty payload and correct content type."""
    response = client.get(
        f"/api/orders/document/{detailed_order.order_reference}/invoice", headers=auth_headers
    )

    assert response.status_code == 200
    assert response.content_type == "application/pdf"
    assert response.data
    assert len(response.data) > 0


def test_generate_document_receipt_success(client, auth_headers, detailed_order):
    """Should generate receipt PDF for delivered order with correct content type."""
    response = client.get(
        f"/api/orders/document/{detailed_order.order_reference}/receipt", headers=auth_headers
    )

    assert response.status_code == 200
    assert response.content_type == "application/pdf"
    assert response.data
    assert len(response.data) > 0


def test_generate_document_invalid_doc_type(client, auth_headers, detailed_order):
    """Should reject unsupported document type."""
    response = client.get(
        f"/api/orders/document/{detailed_order.order_reference}/statement", headers=auth_headers
    )

    assert response.status_code == 400
    assert response.json["success"] is False
    assert "Invalid document type" in response.json["message"]


def test_generate_document_missing_order_reference(client, auth_headers):
    """Should return not found for non-existent order reference."""
    response = client.get("/api/orders/document/PHK-DOES-NOT-EXIST/invoice", headers=auth_headers)

    assert response.status_code == 404
    assert response.json["success"] is False
    assert response.json["message"] == "Order not found"


def test_generate_document_invalid_order_ownership(client, another_user_headers, detailed_order):
    """Should block authenticated user from another user's order."""
    response = client.get(
        f"/api/orders/document/{detailed_order.order_reference}/invoice",
        headers=another_user_headers,
    )

    assert response.status_code == 403
    assert response.json["success"] is False
    assert response.json["message"] == "Unauthorized access to this order"


def test_generate_document_unauthorized_access(client, detailed_order):
    """Should require authentication token."""
    response = client.get(f"/api/orders/document/{detailed_order.order_reference}/invoice")

    assert response.status_code == 401
    assert response.json["error"] == "Authorization required"


def test_generate_pdf_invoice_path(app, detailed_order):
    """Exercise invoice path in _generate_pdf and ensure non-empty bytes are returned."""
    with app.app_context():
        pdf_content = _orders_routes()._generate_pdf(detailed_order, "invoice")

    assert pdf_content is not None
    assert isinstance(pdf_content, bytes)
    assert len(pdf_content) > 0


def test_generate_pdf_receipt_path(app, detailed_order):
    """Exercise receipt path in _generate_pdf and ensure non-empty bytes are returned."""
    with app.app_context():
        pdf_content = _orders_routes()._generate_pdf(detailed_order, "receipt")

    assert pdf_content is not None
    assert isinstance(pdf_content, bytes)
    assert len(pdf_content) > 0


def test_get_invoice_template_contains_expected_placeholders():
    """Template helper should expose invoice-specific labels and placeholders."""
    template = _orders_routes()._get_invoice_template()

    assert "INVOICE" in template
    assert "ORDER ITEMS" in template
    assert "{{ order.order_reference }}" in template


def test_get_receipt_template_contains_expected_placeholders():
    """Template helper should expose receipt-specific labels and placeholders."""
    template = _orders_routes()._get_receipt_template()

    assert "RECEIPT" in template
    assert "TOTAL PAID" in template
    assert "{{ order.order_reference }}" in template
