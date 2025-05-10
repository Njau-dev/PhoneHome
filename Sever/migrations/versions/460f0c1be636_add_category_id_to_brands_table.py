"""Add category_id to brands table

Revision ID: 460f0c1be636
Revises: 9924b637504a
Create Date: 2025-05-07 21:19:51.391325

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '460f0c1be636'
down_revision = '9924b637504a'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Add category_id column as nullable first
    op.add_column('brands', sa.Column('category_id', sa.Integer(), nullable=True))
    
    # 2. Create foreign key constraint
    op.create_foreign_key(
        'fk_brands_category_id', 
        'brands', 'categories',
        ['category_id'], ['id']
    )
    
    # 3. Update existing records - set to category ID 1 or your default category
    op.execute('UPDATE brands SET category_id = 1 WHERE category_id IS NULL')
    
    # 4. Make the column non-nullable
    op.alter_column('brands', 'category_id',
        existing_type=sa.Integer(),
        nullable=False
    )

def downgrade():
    # Remove the foreign key first
    op.drop_constraint('fk_brands_category_id', 'brands', type_='foreignkey')
    
    # Then remove the column
    op.drop_column('brands', 'category_id')
    
    # ### end Alembic commands ###
