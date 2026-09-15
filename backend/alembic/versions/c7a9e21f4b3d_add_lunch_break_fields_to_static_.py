"""add_lunch_break_fields_to_static_shifts

Revision ID: c7a9e21f4b3d
Revises: b43700bba7cc
Create Date: 2026-09-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7a9e21f4b3d'
down_revision: Union[str, Sequence[str], None] = 'b43700bba7cc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('static_shifts', schema=None) as batch_op:
        batch_op.add_column(sa.Column('break_end_time', sa.Time(), nullable=True))
        batch_op.add_column(sa.Column('is_paid_break', sa.Boolean(), nullable=True, server_default=sa.false()))
        batch_op.add_column(sa.Column('overtime_break_minutes', sa.Integer(), nullable=True, server_default='0'))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('static_shifts', schema=None) as batch_op:
        batch_op.drop_column('overtime_break_minutes')
        batch_op.drop_column('is_paid_break')
        batch_op.drop_column('break_end_time')
