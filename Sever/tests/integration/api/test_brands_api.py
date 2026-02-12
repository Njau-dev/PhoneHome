import pytest


def test_create_brand_authorized_success(client, admin_headers):
    response = client.post('/api/brands', headers=admin_headers, json={'name': 'Sony'})

    assert response.status_code == 201
    payload = response.get_json()
    assert payload['success'] is True
    assert payload['data']['brand']['name'] == 'Sony'


def test_create_brand_unauthorized_without_token(client):
    response = client.post('/api/brands', json={'name': 'OnePlus'})

    assert response.status_code == 401


def test_create_brand_forbidden_for_non_admin(client, auth_headers):
    response = client.post('/api/brands', headers=auth_headers, json={'name': 'OnePlus'})

    assert response.status_code == 403


@pytest.mark.parametrize('path', ['/api/brands/999'])
def test_brand_not_found_cases(client, admin_headers, path):
    get_response = client.get(path)
    put_response = client.put(path, headers=admin_headers, json={'name': 'Renamed'})
    delete_response = client.delete(path, headers=admin_headers)

    assert get_response.status_code == 404
    assert put_response.status_code == 404
    assert delete_response.status_code == 404


def test_create_brand_validation_failure_missing_name(client, admin_headers):
    response = client.post('/api/brands', headers=admin_headers, json={})

    assert response.status_code == 400
    assert response.get_json()['message'] == 'Brand name is required'


def test_create_brand_duplicate_action_returns_error(client, admin_headers):
    first = client.post('/api/brands', headers=admin_headers, json={'name': 'Infinix'})
    second = client.post('/api/brands', headers=admin_headers, json={'name': 'Infinix'})

    assert first.status_code == 201
    assert second.status_code == 400
    assert second.get_json()['message'] == 'Brand already exists'
