"""drop admins table and repoint audit logs to users

Revision ID: 8dd4b5f95c75
Revises: fc4209f1f8d2
Create Date: 2026-02-21 10:20:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = "8dd4b5f95c75"
down_revision = "fc4209f1f8d2"
branch_labels = None
depends_on = None


def _table_exists(bind, table_name):
    return inspect(bind).has_table(table_name)


def _get_users_by_email(bind):
    rows = bind.execute(sa.text("SELECT id, email FROM users")).fetchall()
    return {str(email).strip().lower(): user_id for user_id, email in rows if email}


def _get_user_ids(bind):
    rows = bind.execute(sa.text("SELECT id FROM users")).fetchall()
    return {row[0] for row in rows}


def _get_admin_id_to_email(bind):
    rows = bind.execute(sa.text("SELECT id, email FROM admins")).fetchall()
    return {admin_id: email for admin_id, email in rows}


def upgrade():
    bind = op.get_bind()

    if not _table_exists(bind, "audit_logs"):
        if _table_exists(bind, "admins"):
            op.drop_table("admins")
        return

    user_ids = _get_user_ids(bind)
    users_by_email = _get_users_by_email(bind)
    admin_id_to_email = _get_admin_id_to_email(bind) if _table_exists(bind, "admins") else {}

    old_logs = bind.execute(
        sa.text("SELECT admin_id, action, created_at FROM audit_logs ORDER BY id ASC")
    ).fetchall()

    op.create_table(
        "audit_logs_v2",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("admin_id", sa.Integer(), nullable=False),
        sa.Column("action", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["admin_id"], ["users.id"]),
    )

    for old_admin_id, action, created_at in old_logs:
        mapped_user_id = None

        if old_admin_id in user_ids:
            mapped_user_id = old_admin_id
        else:
            admin_email = admin_id_to_email.get(old_admin_id)
            if admin_email:
                mapped_user_id = users_by_email.get(str(admin_email).strip().lower())

        if mapped_user_id is None:
            continue

        bind.execute(
            sa.text(
                "INSERT INTO audit_logs_v2 (admin_id, action, created_at) "
                "VALUES (:admin_id, :action, :created_at)"
            ),
            {"admin_id": mapped_user_id, "action": action, "created_at": created_at},
        )

    op.drop_table("audit_logs")
    op.rename_table("audit_logs_v2", "audit_logs")

    if _table_exists(bind, "admins"):
        op.drop_table("admins")


def downgrade():
    # This migration is intentionally one-way because admin data is consolidated into users.
    pass
