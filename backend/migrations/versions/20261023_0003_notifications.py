"""Durable notification outbox and idempotent completed transfers."""
from alembic import op
import sqlalchemy as sa

revision = "20261023_0003"
down_revision = "20261023_0002"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("stock_transfers", sa.Column("request_key", sa.String(36), nullable=True))
    op.create_unique_constraint("uq_transfer_request_key", "stock_transfers", ["request_key"])
    op.create_table("email_messages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("event_key", sa.String(255), nullable=False, unique=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("subject", sa.String(255), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("last_error", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("next_attempt_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_email_messages_user_id", "email_messages", ["user_id"])


def downgrade():
    op.drop_table("email_messages")
    op.drop_constraint("uq_transfer_request_key", "stock_transfers", type_="unique")
    op.drop_column("stock_transfers", "request_key")
