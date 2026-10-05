"""Add user LLM configuration columns

Revision ID: 0002_add_user_llm_settings
Revises: 0001_initial
Create Date: 2026-10-02 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0002_add_user_llm_settings"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("llm_provider", sa.String(length=50), nullable=True))
    op.add_column("users", sa.Column("llm_model", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("llm_api_key_encrypted", sa.String(length=512), nullable=True))
    op.add_column("users", sa.Column("llm_base_url", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "llm_base_url")
    op.drop_column("users", "llm_api_key_encrypted")
    op.drop_column("users", "llm_model")
    op.drop_column("users", "llm_provider")
