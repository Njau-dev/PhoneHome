"""sync user role and is_admin flags

Revision ID: fc4209f1f8d2
Revises: d3def29542b6
Create Date: 2026-02-20 18:40:00.000000

"""

from alembic import op


# revision identifiers, used by Alembic.
revision = "fc4209f1f8d2"
down_revision = "d3def29542b6"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("UPDATE users SET role = LOWER(role) WHERE role IS NOT NULL")
    op.execute("UPDATE users SET role = 'user' WHERE role IS NULL OR TRIM(role) = ''")
    op.execute("UPDATE users SET role = 'user' WHERE role NOT IN ('user', 'admin')")
    op.execute("UPDATE users SET role = 'admin' WHERE is_admin = TRUE")
    op.execute("UPDATE users SET is_admin = TRUE WHERE role = 'admin'")
    op.execute("UPDATE users SET is_admin = FALSE WHERE role <> 'admin'")


def downgrade():
    # Irreversible data-normalization migration.
    pass
