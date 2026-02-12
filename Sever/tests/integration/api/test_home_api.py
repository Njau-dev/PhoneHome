
def test_home_authorized_success_public_endpoint(client, product):
    response = client.get('/api/home')

    assert response.status_code == 200
    payload = response.get_json()
    assert payload['success'] is True
    assert 'trending' in payload['data']


def test_home_unauthorized_case_not_applicable_public_route(client):
    response = client.get('/api/home')

    assert response.status_code == 200


def test_home_forbidden_role_case_not_applicable_public_route(client, auth_headers):
    response = client.get('/api/home', headers=auth_headers)

    assert response.status_code == 200


def test_home_not_found_case(client):
    response = client.get('/api/home/non-existent')

    assert response.status_code == 404


def test_home_input_validation_failure_via_invalid_method(client):
    response = client.post('/api/home', json={'unexpected': True})

    assert response.status_code == 404


def test_home_idempotency_repeat_get(client):
    first = client.get('/api/home')
    second = client.get('/api/home')

    assert first.status_code == 200
    assert second.status_code == 200
