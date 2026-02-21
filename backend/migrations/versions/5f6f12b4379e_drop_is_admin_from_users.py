"""drop is_admin from users

Revision ID: 5f6f12b4379e
Revises: 8dd4b5f95c75
Create Date: 2026-02-21 11:05:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = "5f6f12b4379e"
down_revision = "8dd4b5f95c75"
branch_labels = None
depends_on = None


def _column_exists(bind, table_name, column_name):
    inspector = inspect(bind)
    if not inspector.has_table(table_name):
        return False
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def upgrade():
    bind = op.get_bind()

    if not _column_exists(bind, "users", "is_admin"):
        return

    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_column("is_admin")


def downgrade():
    bind = op.get_bind()

    if _column_exists(bind, "users", "is_admin"):
        return

    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false())
        )

    op.execute("UPDATE users SET is_admin = TRUE WHERE role = 'admin'")
    op.execute("UPDATE users SET is_admin = FALSE WHERE role <> 'admin'")
