"""stretch_goals

Revision ID: 7a1e3b2f8c09
Revises: 5d3a3459b517
Create Date: 2026-10-29 02:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '7a1e3b2f8c09'
down_revision: Union[str, Sequence[str], None] = '5d3a3459b517'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('agents', schema=None) as batch_op:
        batch_op.add_column(sa.Column('password_hash', sa.String(length=255), nullable=True))

    with op.batch_alter_table('tickets', schema=None) as batch_op:
        batch_op.add_column(sa.Column('first_responded_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('version', sa.Integer(), nullable=False, server_default='1'))


def downgrade() -> None:
    with op.batch_alter_table('tickets', schema=None) as batch_op:
        batch_op.drop_column('version')
        batch_op.drop_column('first_responded_at')

    with op.batch_alter_table('agents', schema=None) as batch_op:
        batch_op.drop_column('password_hash')

