def test_add_to_compare_authorized_success(client, auth_headers, product):
    response = client.post("/api/compare", headers=auth_headers, json={"product_id": product.id})

    assert response.status_code == 201
    assert response.get_json()["success"] is True


def test_compare_unauthorized_without_token(client, product):
    response = client.post("/api/compare", json={"product_id": product.id})

    assert response.status_code == 401


def test_compare_allows_any_authenticated_role(client, admin_headers, product):
    response = client.post("/api/compare", headers=admin_headers, json={"product_id": product.id})

    assert response.status_code == 201


def test_compare_not_found_cases(client, auth_headers):
    add_missing = client.post("/api/compare", headers=auth_headers, json={"product_id": 99999})
    remove_missing = client.delete("/api/compare/99999", headers=auth_headers)

    assert add_missing.status_code == 404
    assert remove_missing.status_code == 404


def test_compare_validation_failure_invalid_product_id(client, auth_headers):
    missing = client.post("/api/compare", headers=auth_headers, json={})
    invalid_type = client.post("/api/compare", headers=auth_headers, json={"product_id": "abc"})

    assert missing.status_code == 400
    assert invalid_type.status_code == 400


def test_compare_duplicate_action_is_idempotent(client, auth_headers, product):
    first = client.post("/api/compare", headers=auth_headers, json={"product_id": product.id})
    second = client.post("/api/compare", headers=auth_headers, json={"product_id": product.id})

    assert first.status_code == 201
    assert second.status_code == 200
    assert "already in compare list" in second.get_json()["message"]


def test_clear_compare_idempotent_when_already_empty(client, auth_headers):
    first = client.delete("/api/compare/clear", headers=auth_headers)
    second = client.delete("/api/compare/clear", headers=auth_headers)

    assert first.status_code == 200
    assert second.status_code == 200
