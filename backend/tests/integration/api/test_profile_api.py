def _assert_response_shape(payload):
    assert {"success", "data", "message"}.issubset(payload.keys())


def test_get_profile_happy_path(client, auth_headers, user):
    response = client.get("/api/profile/", headers=auth_headers)
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
    assert "profile" in body["data"]
    assert {"username", "email", "phone_number"}.issubset(body["data"]["profile"].keys())


def test_update_profile_happy_path(client, auth_headers):
    response = client.put(
        "/api/profile/",
        headers=auth_headers,
        json={"username": "renamed", "address": "Nairobi"},
    )
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)


def test_get_profile_stats_empty_dataset(client, auth_headers):
    response = client.get("/api/profile/stats", headers=auth_headers)
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
    assert {"order_count", "total_payment", "wishlist_count", "review_count"}.issubset(body["data"]["stats"].keys())


def test_profile_requires_authentication(client):
    response = client.get("/api/profile/")

    assert response.status_code == 401
    assert {"error", "message"}.issubset(response.get_json().keys())


def test_get_profile_wishlist_empty(client, auth_headers):
    response = client.get("/api/profile/wishlist", headers=auth_headers)
    body = response.get_json()

    assert response.status_code == 200
    _assert_response_shape(body)
    assert body["data"]["wishlist"] == []
