def test_create_category_authorized_success(client, admin_headers):
    response = client.post("/api/categories", headers=admin_headers, json={"name": "Tablet"})

    assert response.status_code == 201
    payload = response.get_json()
    assert payload["success"] is True
    assert payload["data"]["data"]["name"] == "Tablet"


def test_create_category_unauthorized_without_token(client):
    response = client.post("/api/categories", json={"name": "Audio"})

    assert response.status_code == 401


def test_create_category_forbidden_for_non_admin(client, auth_headers):
    response = client.post("/api/categories", headers=auth_headers, json={"name": "Audio"})

    assert response.status_code == 403


def test_category_not_found_cases(client, admin_headers):
    get_response = client.get("/api/categories/999")
    put_response = client.put(
        "/api/categories/999", headers=admin_headers, json={"name": "Updated"}
    )
    delete_response = client.delete("/api/categories/999", headers=admin_headers)

    assert get_response.status_code in (404, 500)
    assert put_response.status_code == 404
    assert delete_response.status_code == 404


def test_create_category_validation_failure_missing_name(client, admin_headers):
    response = client.post("/api/categories", headers=admin_headers, json={})

    assert response.status_code == 400
    assert response.get_json()["message"] == "Category name is required"


def test_delete_category_duplicate_action(client, admin_headers):
    create = client.post("/api/categories", headers=admin_headers, json={"name": "Wearables"})
    category_id = create.get_json()["data"]["data"]["id"]

    first_delete = client.delete(f"/api/categories/{category_id}", headers=admin_headers)
    second_delete = client.delete(f"/api/categories/{category_id}", headers=admin_headers)

    assert first_delete.status_code == 200
    assert second_delete.status_code == 404
