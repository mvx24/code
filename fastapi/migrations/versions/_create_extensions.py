# pylint: skip-file
"""Create the prerequisite PostgreSQL extensions.

Revision ID: _create_extensions
Revises: -
Create Date: -

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "_create_extensions"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.execute('CREATE EXTENSION IF NOT EXISTS "hstore";')
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')


def downgrade():
    pass
