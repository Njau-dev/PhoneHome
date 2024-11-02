"""Add camera features to tablet

Revision ID: e548138db625
Revises: f05898053921
Create Date: 2024-10-19 11:34:31.964424

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e548138db625'
down_revision = 'f05898053921'
branch_labels = None
depends_on = None


def upgrade():
    # Add the new column 'front_camera' with a default value
    op.add_column('tablets', sa.Column('front_camera', sa.String(length=100), nullable=False, server_default='8MP'))

def downgrade():
    # Remove the column in case of a downgrade
    op.drop_column('tablets', 'front_camera')