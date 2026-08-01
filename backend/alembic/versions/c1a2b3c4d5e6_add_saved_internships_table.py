"""add_saved_internships_table

Revision ID: c1a2b3c4d5e6
Revises: eb5dcfbd0c30
Create Date: 2026-08-01 14:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1a2b3c4d5e6'
down_revision: Union[str, None] = 'eb5dcfbd0c30'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'saved_internships',
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('internship_id', sa.UUID(), nullable=False),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['internship_id'], ['internships.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'internship_id', name='uq_user_internship_saved')
    )
    op.create_index(op.f('ix_saved_internships_id'), 'saved_internships', ['id'], unique=False)
    op.create_index(op.f('ix_saved_internships_internship_id'), 'saved_internships', ['internship_id'], unique=False)
    op.create_index(op.f('ix_saved_internships_user_id'), 'saved_internships', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_saved_internships_user_id'), table_name='saved_internships')
    op.drop_index(op.f('ix_saved_internships_internship_id'), table_name='saved_internships')
    op.drop_index(op.f('ix_saved_internships_id'), table_name='saved_internships')
    op.drop_table('saved_internships')
