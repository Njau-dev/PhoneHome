from app.services.notification_service import NotificationService
from app.models import Notification
from app import create_app
import logging
import os
from datetime import datetime
from types import SimpleNamespace

os.environ.setdefault("SECRET_KEY", "test-secret")

_test_app = create_app("testing")
_test_ctx = _test_app.app_context()
_test_ctx.push()


def _notification_service(app):
    with app.app_context():
        from app.services.notification_service import NotificationService
        return NotificationService


# Happy path tests
def test_create_notification_happy_path(app, user):
    service = _notification_service(app)
    note = service.create_notification(user.id, "Welcome")

    assert note is not None
    assert note.user_id == user.id
    assert note.is_read is False


def test_create_notification_success_commits_and_returns_object(db, user):
    notification = NotificationService.create_notification(
        user.id, "Order dispatched")

    assert notification is not None
    assert notification.user_id == user.id
    assert notification.is_read is False


# Error handling tests
def test_create_notification_db_error_rolls_back_and_logs(monkeypatch, caplog):
    called = {"rollback": 0}

    def fail_add(_obj):
        raise RuntimeError("db write failed")

    monkeypatch.setattr(
        "app.services.notification_service.db.session.add", fail_add)
    monkeypatch.setattr(
        "app.services.notification_service.db.session.rollback",
        lambda: called.__setitem__("rollback", called["rollback"] + 1),
    )

    with caplog.at_level(logging.ERROR):
        result = NotificationService.create_notification(1, "broken")

    assert result is None
    assert called["rollback"] == 1
    assert "Error creating notification" in caplog.text


# Get notifications tests
def test_get_user_notifications_unread_only_filters(app, user):
    service = _notification_service(app)
    service.create_notification(user.id, "First")
    note = service.create_notification(user.id, "Second")
    service.mark_as_read(note.id, user.id)

    unread = service.get_user_notifications(user.id, unread_only=True)

    assert len(unread) == 1
    assert unread[0]["message"] == "First"
    assert {"id", "message", "is_read",
            "created_at"}.issubset(unread[0].keys())


def test_get_user_notifications_unread_filter_mapping(monkeypatch):
    rows = [
        SimpleNamespace(id=1, message="Unread", is_read=False,
                        created_at=datetime(2025, 1, 1, 10, 0, 0)),
        SimpleNamespace(id=2, message="Unread 2", is_read=False,
                        created_at=datetime(2025, 1, 2, 10, 0, 0)),
    ]

    class FakeQuery:
        def __init__(self):
            self.filters = []

        def filter_by(self, **kwargs):
            self.filters.append(kwargs)
            return self

        def order_by(self, *_args, **_kwargs):
            return self

        def all(self):
            return rows

    fake_query = FakeQuery()
    monkeypatch.setattr(
        "app.services.notification_service.Notification.query", fake_query)

    result = NotificationService.get_user_notifications(
        user_id=9, unread_only=True)

    assert fake_query.filters == [{"user_id": 9}, {"is_read": False}]
    assert result[0]["id"] == 1
    assert result[0]["created_at"].startswith("2025-01-01T10:00:00")


# Mark as read tests
def test_mark_as_read_wrong_user_returns_false(app, user, create_user):
    service = _notification_service(app)
    other = create_user(username="other", email="other@example.com")
    note = service.create_notification(user.id, "Private")

    result = service.mark_as_read(note.id, other.id)

    assert result is False


def test_mark_as_read_not_found_returns_false(monkeypatch):
    class FakeReadQuery:
        def filter_by(self, **_kwargs):
            return self

        def first(self):
            return None

    monkeypatch.setattr(
        "app.services.notification_service.Notification.query", FakeReadQuery())

    assert NotificationService.mark_as_read(
        notification_id=1, user_id=2) is False


# Mark all as read tests
def test_mark_all_as_read_empty_dataset_returns_zero(app, user):
    service = _notification_service(app)
    count = service.mark_all_as_read(user.id)
    assert count == 0


def test_mark_all_as_read_updates_unread_count(app, user):
    service = _notification_service(app)
    service.create_notification(user.id, "One")
    service.create_notification(user.id, "Two")

    count = service.mark_all_as_read(user.id)

    assert count == 2
    assert Notification.query.filter_by(
        user_id=user.id, is_read=False).count() == 0


def test_mark_all_as_read_handles_update_error(monkeypatch, caplog):
    called = {"rollback": 0}

    class FakeUpdateQuery:
        def filter_by(self, **_kwargs):
            return self

        def update(self, _payload):
            raise RuntimeError("update failed")

    monkeypatch.setattr(
        "app.services.notification_service.Notification.query", FakeUpdateQuery())
    monkeypatch.setattr(
        "app.services.notification_service.db.session.rollback",
        lambda: called.__setitem__("rollback", called["rollback"] + 1),
    )

    with caplog.at_level(logging.ERROR):
        result = NotificationService.mark_all_as_read(user_id=10)

    assert result == 0
    assert called["rollback"] == 1
    assert "Error marking all notifications as read" in caplog.text
