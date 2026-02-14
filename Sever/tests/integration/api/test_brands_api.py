import pytest

from app.models import Brand


def test_create_brand_authorized_success(client, admin_headers):
    response = client.post("/api/brands", headers=admin_headers, json={"name": "Sony"})

    assert response.status_code == 201
    payload = response.get_json()
    assert payload["success"] is True
    assert payload["data"]["brand"]["name"] == "Sony"


def test_create_brand_unauthorized_without_token(client):
    response = client.post("/api/brands", json={"name": "OnePlus"})

    assert response.status_code == 401


def test_create_brand_forbidden_for_non_admin(client, auth_headers):
    response = client.post("/api/brands", headers=auth_headers, json={"name": "OnePlus"})

    assert response.status_code == 403


@pytest.mark.parametrize("path", ["/api/brands/999"])
def test_brand_not_found_cases(client, admin_headers, path):
    get_response = client.get(path)
    put_response = client.put(path, headers=admin_headers, json={"name": "Renamed"})
    delete_response = client.delete(path, headers=admin_headers)

    assert get_response.status_code == 404
    assert put_response.status_code == 404
    assert delete_response.status_code == 404


def test_create_brand_validation_failure_missing_name(client, admin_headers):
    response = client.post("/api/brands", headers=admin_headers, json={})

    assert response.status_code == 400
    assert response.get_json()["message"] == "Brand name is required"


def test_create_brand_duplicate_action_returns_error(client, admin_headers):
    first = client.post("/api/brands", headers=admin_headers, json={"name": "Infinix"})
    second = client.post("/api/brands", headers=admin_headers, json={"name": "Infinix"})

    assert first.status_code == 201
    assert second.status_code == 400
    assert second.get_json()["message"] == "Brand already exists"


def test_get_all_brands_happy_path(client, brand):
    response = client.get("/api/brands")
    payload = response.get_json()

    assert response.status_code == 200
    assert payload["success"] is True
    assert isinstance(payload["data"]["brands"], list)
    assert any(b["id"] == brand.id for b in payload["data"]["brands"])


def test_get_all_brands_handles_exception(client, monkeypatch):
    monkeypatch.setattr(
        "app.api.brands.routes.db.session.query",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(RuntimeError("query failed")),
    )

    response = client.get("/api/brands")
    payload = response.get_json()

    assert response.status_code == 500
    assert payload["success"] is False
    assert payload["message"] == "An error occurred while fetching brands"


def test_get_brand_by_id_happy_path(client, brand):
    response = client.get(f"/api/brands/{brand.id}")
    payload = response.get_json()

    assert response.status_code == 200
    assert payload["success"] is True
    assert payload["data"]["brand"]["id"] == brand.id


def test_get_brand_by_id_handles_exception(client, monkeypatch):
    monkeypatch.setattr(
        "app.api.brands.routes.db.session.get",
        lambda *_args, **_kwargs: (_ for _ in ()).throw(RuntimeError("db down")),
    )

    response = client.get("/api/brands/1")
    payload = response.get_json()

    assert response.status_code == 500
    assert payload["success"] is False
    assert payload["message"] == "An error occurred while fetching the brand"


def test_create_brand_handles_exception(client, admin_headers, monkeypatch):
    monkeypatch.setattr(
        "app.api.brands.routes.db.session.commit",
        lambda: (_ for _ in ()).throw(RuntimeError("commit failed")),
    )

    response = client.post("/api/brands", headers=admin_headers, json={"name": "Tecno"})
    payload = response.get_json()

    assert response.status_code == 500
    assert payload["success"] is False
    assert payload["message"] == "An error occurred while creating the brand"


def test_update_brand_happy_path(client, admin_headers, brand):
    response = client.put(
        f"/api/brands/{brand.id}", headers=admin_headers, json={"name": "Renamed"}
    )
    payload = response.get_json()

    assert response.status_code == 200
    assert payload["success"] is True
    assert payload["data"]["brand"]["name"] == "Renamed"
    assert Brand.query.get(brand.id).name == "Renamed"


def test_update_brand_handles_exception(client, admin_headers, brand, monkeypatch):
    monkeypatch.setattr(
        "app.api.brands.routes.db.session.commit",
        lambda: (_ for _ in ()).throw(RuntimeError("commit failed")),
    )

    response = client.put(f"/api/brands/{brand.id}", headers=admin_headers, json={"name": "Boom"})
    payload = response.get_json()

    assert response.status_code == 500
    assert payload["success"] is False
    assert payload["message"] == "An error occurred while updating the brand"


def test_delete_brand_happy_path(client, admin_headers, brand):
    response = client.delete(f"/api/brands/{brand.id}", headers=admin_headers)
    payload = response.get_json()

    assert response.status_code == 200
    assert payload["success"] is True
    assert Brand.query.get(brand.id) is None


def test_delete_brand_handles_exception(client, admin_headers, brand, monkeypatch):
    monkeypatch.setattr(
        "app.api.brands.routes.db.session.delete",
        lambda _obj: (_ for _ in ()).throw(RuntimeError("delete failed")),
    )

    response = client.delete(f"/api/brands/{brand.id}", headers=admin_headers)
    payload = response.get_json()

    assert response.status_code == 500
    assert payload["success"] is False
    assert payload["message"] == "An error occurred while deleting the brand"
