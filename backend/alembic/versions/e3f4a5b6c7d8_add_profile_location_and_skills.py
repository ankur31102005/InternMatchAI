"""add_profile_location_and_skills

Revision ID: e3f4a5b6c7d8
Revises: d2b3c4d5e6f7
Create Date: 2026-08-01 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e3f4a5b6c7d8'
down_revision: Union[str, None] = 'd2b3c4d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('student_profiles', sa.Column('location', sa.String(length=255), nullable=True))
    op.add_column('student_profiles', sa.Column('skills', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('student_profiles', 'skills')
    op.drop_column('student_profiles', 'location')
