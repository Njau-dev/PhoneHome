import pytest


def test_send_notification_authorized_success(client, admin_headers, user):
    response = client.post(
        '/api/admin/notifications',
        headers=admin_headers,
        json={'user_id': user.id, 'message': 'Admin broadcast'}
    )

    assert response.status_code == 201
    assert response.get_json()['success'] is True


def test_admin_endpoint_unauthorized_without_token(client):
    response = client.get('/api/admin/users')

    assert response.status_code == 401


def test_admin_endpoint_forbidden_for_non_admin(client, auth_headers):
    response = client.get('/api/admin/users', headers=auth_headers)

    assert response.status_code == 403
    assert response.get_json()['error'] == 'Admin privileges required'


@pytest.mark.parametrize('path,method', [
    ('/api/admin/users/999/promote', 'put'),
    ('/api/admin/users/999', 'delete'),
])
def test_admin_not_found_cases(client, admin_headers, path, method):
    response = getattr(client, method)(path, headers=admin_headers)

    assert response.status_code == 404
    assert response.get_json()['message'] == 'User not found'


def test_send_notification_input_validation_failure(client, admin_headers):
    response = client.post('/api/admin/notifications', headers=admin_headers, json={'user_id': None})

    assert response.status_code == 400
    assert response.get_json()['message'] == 'user_id and message are required'


def test_promote_user_duplicate_action_is_idempotent(client, admin_headers, user):
    first = client.put(f'/api/admin/users/{user.id}/promote', headers=admin_headers)
    second = client.put(f'/api/admin/users/{user.id}/promote', headers=admin_headers)

    assert first.status_code == 200
    assert second.status_code == 200
    assert 'promoted to admin' in second.get_json()['message']
