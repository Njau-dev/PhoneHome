from app.models import Notification


def test_get_notifications_authorized_success(client, auth_headers, user, db):
    db.session.add(Notification(user_id=user.id, message="Welcome!"))
    db.session.commit()

    response = client.get("/api/notifications/user", headers=auth_headers)

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["success"] is True
    assert len(payload["data"]["notifications"]) == 1


def test_notifications_unauthorized_without_token(client):
    response = client.get("/api/notifications/user")

    assert response.status_code == 401


def test_notifications_no_forbidden_role_allows_admin(client, admin_headers):
    response = client.get("/api/notifications/user", headers=admin_headers)

    assert response.status_code == 200


def test_mark_notification_not_found(client, auth_headers):
    response = client.put("/api/notifications/user/999/read", headers=auth_headers)

    assert response.status_code == 404


def test_mark_notification_validation_failure_via_bad_path_type(client, auth_headers):
    response = client.put("/api/notifications/user/not-an-int/read", headers=auth_headers)

    assert response.status_code == 404


def test_mark_notification_duplicate_action_is_idempotent(client, auth_headers, user, db):
    notification = Notification(user_id=user.id, message="Order shipped")
    db.session.add(notification)
    db.session.commit()

    first = client.put(f"/api/notifications/user/{notification.id}/read", headers=auth_headers)
    second = client.put(f"/api/notifications/user/{notification.id}/read", headers=auth_headers)

    assert first.status_code == 200
    assert second.status_code == 200
