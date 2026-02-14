from types import SimpleNamespace

from app.extensions import db
from app.models import Product, Review


def _assert_response_shape(payload):
    assert {"success", "data", "message"}.issubset(payload.keys())


def test_get_product_reviews_happy_path(client, review):
    response = client.get(f"/api/reviews/product/{review.product_id}")
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
    assert "reviews" in body["data"]
    assert {"id", "user", "rating", "comment"}.issubset(body["data"]["reviews"][0].keys())


def test_get_product_reviews_product_not_found(client):
    response = client.get("/api/reviews/product/999999")
    body = response.get_json()

    assert response.status_code == 404
    _assert_response_shape(body)
    assert body["message"] == "Product not found"


def test_get_product_reviews_returns_empty_list_when_none_exist(client, product):
    response = client.get(f"/api/reviews/product/{product.id}")
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
    assert body["data"]["reviews"] == []


def test_get_product_reviews_handles_exception(client, monkeypatch):
    monkeypatch.setattr(
        "app.api.reviews.routes.Product.query",
        SimpleNamespace(get=lambda _product_id: (_ for _ in ()).throw(RuntimeError("db down"))),
    )

    response = client.get("/api/reviews/product/1")
    body = response.get_json()

    assert response.status_code == 500
    _assert_response_shape(body)
    assert body["message"] == "An error occurred while fetching reviews"


def test_add_review_happy_path(client, auth_headers, product):
    response = client.post(
        f"/api/reviews/product/{product.id}",
        headers=auth_headers,
        json={"rating": 5, "comment": "Great!"},
    )
    body = response.get_json()

    assert response.status_code == 201
    _assert_response_shape(body)
    assert body["message"] == "Review added successfully!"


def test_add_review_duplicate_operation(client, auth_headers, review):
    response = client.post(
        f"/api/reviews/product/{review.product_id}",
        headers=auth_headers,
        json={"rating": 4, "comment": "Again"},
    )
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)
    assert body["message"] == "You have already reviewed this product"


def test_add_review_product_not_found(client, auth_headers):
    response = client.post(
        "/api/reviews/product/999999",
        headers=auth_headers,
        json={"rating": 5, "comment": "Great!"},
    )
    body = response.get_json()

    assert response.status_code == 404
    _assert_response_shape(body)
    assert body["message"] == "Product not found"


def test_add_review_requires_rating_field(client, auth_headers, product):
    response = client.post(
        f"/api/reviews/product/{product.id}",
        headers=auth_headers,
        json={"comment": "Missing rating"},
    )
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)
    assert body["message"] == "Rating is required"


def test_add_review_rejects_invalid_rating_range(client, auth_headers, product):
    response = client.post(
        f"/api/reviews/product/{product.id}",
        headers=auth_headers,
        json={"rating": 7, "comment": "Too high"},
    )
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)
    assert body["message"] == "Rating must be between 1 and 5"


def test_add_review_handles_exception_and_rolls_back(client, auth_headers, product, monkeypatch):
    monkeypatch.setattr(
        "app.api.reviews.routes.db.session.commit",
        lambda: (_ for _ in ()).throw(RuntimeError("commit failed")),
    )

    response = client.post(
        f"/api/reviews/product/{product.id}",
        headers=auth_headers,
        json={"rating": 4, "comment": "good"},
    )
    body = response.get_json()

    assert response.status_code == 500
    _assert_response_shape(body)
    assert body["message"] == "An error occurred while adding the review"


def test_update_review_not_found(client, auth_headers):
    response = client.put("/api/reviews/999999", headers=auth_headers, json={"rating": 3})
    body = response.get_json()

    assert response.status_code == 404
    _assert_response_shape(body)
    assert body["message"] == "Review not found"


def test_update_review_unauthorized_owner(client, auth_headers, review, create_user):
    other = create_user(username="other2", email="other2@example.com")
    review.user_id = other.id
    db.session.commit()

    response = client.put(f"/api/reviews/{review.id}", headers=auth_headers, json={"rating": 3})
    body = response.get_json()

    assert response.status_code == 403
    _assert_response_shape(body)
    assert body["message"] == "You can only update your own reviews"


def test_update_review_requires_body(client, auth_headers, review):
    response = client.put(f"/api/reviews/{review.id}", headers=auth_headers, json={})
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)
    assert body["message"] == "Request body is required"


def test_update_review_rejects_invalid_rating(client, auth_headers, review):
    response = client.put(
        f"/api/reviews/{review.id}",
        headers=auth_headers,
        json={"rating": 0, "comment": "bad"},
    )
    body = response.get_json()

    assert response.status_code == 400
    _assert_response_shape(body)
    assert body["message"] == "Rating must be between 1 and 5"


def test_update_review_happy_path(client, auth_headers, review):
    response = client.put(
        f"/api/reviews/{review.id}",
        headers=auth_headers,
        json={"rating": 4, "comment": "Updated comment"},
    )
    body = response.get_json()

    db.session.refresh(review)

    assert response.status_code == 200
    _assert_response_shape(body)
    assert body["message"] == "Review updated successfully!"
    assert review.rating == 4
    assert review.comment == "Updated comment"


def test_update_review_handles_exception(client, auth_headers, review, monkeypatch):
    monkeypatch.setattr(
        "app.api.reviews.routes.db.session.commit",
        lambda: (_ for _ in ()).throw(RuntimeError("commit failed")),
    )

    response = client.put(
        f"/api/reviews/{review.id}",
        headers=auth_headers,
        json={"rating": 4},
    )
    body = response.get_json()

    assert response.status_code == 500
    _assert_response_shape(body)
    assert body["message"] == "An error occurred while updating the review"


def test_delete_review_not_found(client, auth_headers):
    response = client.delete("/api/reviews/999999", headers=auth_headers)
    body = response.get_json()

    assert response.status_code == 404
    _assert_response_shape(body)
    assert body["message"] == "Review not found"


def test_delete_review_unauthorized_owner(client, auth_headers, review, create_user):
    other = create_user(username="other-del", email="other-del@example.com")
    review.user_id = other.id
    db.session.commit()

    response = client.delete(f"/api/reviews/{review.id}", headers=auth_headers)
    body = response.get_json()

    assert response.status_code == 403
    _assert_response_shape(body)
    assert body["message"] == "You can only delete your own reviews"


def test_delete_review_happy_path(client, auth_headers, review):
    review_id = review.id
    response = client.delete(f"/api/reviews/{review_id}", headers=auth_headers)
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
    assert body["message"] == "Review deleted!"
    assert Review.query.get(review_id) is None


def test_delete_review_handles_exception(client, auth_headers, review, monkeypatch):
    monkeypatch.setattr(
        "app.api.reviews.routes.db.session.delete",
        lambda _review: (_ for _ in ()).throw(RuntimeError("delete failed")),
    )

    response = client.delete(f"/api/reviews/{review.id}", headers=auth_headers)
    body = response.get_json()

    assert response.status_code == 500
    _assert_response_shape(body)
    assert body["message"] == "An error occurred while deleting the review"


def test_get_my_reviews_requires_auth(client):
    response = client.get("/api/reviews/my-reviews")

    assert response.status_code == 401
    assert {"error", "message"}.issubset(response.get_json().keys())


def test_get_my_reviews_happy_path(client, auth_headers, review):
    response = client.get("/api/reviews/my-reviews", headers=auth_headers)
    body = response.get_json()
    product = Product.query.get(review.product_id)

    assert response.status_code == 200
    _assert_response_shape(body)
    assert len(body["data"]["reviews"]) == 1
    review_item = body["data"]["reviews"][0]
    assert review_item["product_name"] == product.name
    assert review_item["product_image"] == product.image_urls[0]


def test_get_my_reviews_handles_missing_product(client, auth_headers, review, monkeypatch):
    monkeypatch.setattr(
        "app.api.reviews.routes.Product.query",
        SimpleNamespace(get=lambda _product_id: None),
    )

    response = client.get("/api/reviews/my-reviews", headers=auth_headers)
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
    assert body["data"]["reviews"][0]["product_name"] == "Unknown"
    assert body["data"]["reviews"][0]["product_image"] is None


def test_get_my_reviews_handles_internal_error(client, auth_headers, monkeypatch):
    class BrokenReviewQuery:
        def filter_by(self, **_kwargs):
            raise RuntimeError("query failed")

    monkeypatch.setattr("app.api.reviews.routes.Review.query", BrokenReviewQuery())

    response = client.get("/api/reviews/my-reviews", headers=auth_headers)
    body = response.get_json()

    assert response.status_code == 500
    _assert_response_shape(body)
    assert body["message"] == "An error occurred while fetching your reviews"
