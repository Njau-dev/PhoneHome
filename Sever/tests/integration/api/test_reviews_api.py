from app.extensions import db


def _assert_response_shape(payload):
    assert {"success", "data", "message"}.issubset(payload.keys())


def test_get_product_reviews_happy_path(client, review):
    response = client.get(f"/api/reviews/product/{review.product_id}")
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
    assert "reviews" in body["data"]
    assert {"id", "user", "rating", "comment"}.issubset(body["data"]["reviews"][0].keys())


def test_add_review_happy_path(client, auth_headers, product):
    response = client.post(
        f"/api/reviews/product/{product.id}",
        headers=auth_headers,
        json={"rating": 5, "comment": "Great!"},
    )
    body = response.get_json()

    assert response.status_code == 201
    _assert_response_shape(body)


def test_add_review_duplicate_operation(client, auth_headers, review):
    response = client.post(
        f"/api/reviews/product/{review.product_id}",
        headers=auth_headers,
        json={"rating": 4, "comment": "Again"},
    )
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)


def test_update_review_unauthorized_owner(client, auth_headers, review, create_user):
    other = create_user(username="other2", email="other2@example.com")
    review.user_id = other.id
    db.session.commit()

    response = client.put(f"/api/reviews/{review.id}", headers=auth_headers, json={"rating": 3})
    body = response.get_json()

    assert response.status_code == 403
    _assert_response_shape(body)


def test_get_my_reviews_requires_auth(client):
    response = client.get("/api/reviews/my-reviews")

    assert response.status_code == 401
    assert {"error", "message"}.issubset(response.get_json().keys())
