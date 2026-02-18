from app.extensions import db
from app.models import CartItem


def _assert_response_shape(payload):
    assert {"success", "data", "message"}.issubset(payload.keys())


def _order_payload(total=2000, payment_method="COD"):
    return {
        "address": {
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com",
            "phone": "0712345678",
            "city": "Nairobi",
            "street": "Kenyatta Ave",
            "additionalInfo": "Near CBD",
        },
        "payment_method": payment_method,
        "total_amount": total,
    }


def test_create_order_happy_path(client, auth_headers, cart, product):
    db.session.add(CartItem(cart_id=cart.id, product_id=product.id, quantity=1))
    db.session.commit()

    response = client.post(
        "/api/orders/",
        headers=auth_headers,
        json=_order_payload(total=float(product.price)),
    )
    body = response.get_json()

    assert response.status_code == 201
    _assert_response_shape(body)
    assert "order_reference" in body["data"]


def test_create_order_validation_error_missing_address(client, auth_headers):
    response = client.post(
        "/api/orders/", headers=auth_headers, json={"payment_method": "COD", "total_amount": 100}
    )
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)


def test_get_order_by_reference_not_found(client, auth_headers):
    response = client.get("/api/orders/PHK-999", headers=auth_headers)
    body = response.get_json()

    assert response.status_code == 404
    _assert_response_shape(body)


def test_update_order_status_invalid_status(client, admin_headers, order):
    response = client.put(
        f"/api/orders/status/{order.id}",
        headers=admin_headers,
        json={"status": "NotARealStatus"},
    )
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)
    assert "invalid status" in body["message"].lower()


def test_get_all_orders_unauthorized_for_non_admin(client, auth_headers):
    response = client.get("/api/orders/admin/all", headers=auth_headers)

    assert response.status_code == 403
    assert "error" in response.get_json()
