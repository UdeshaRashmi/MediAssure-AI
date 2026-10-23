"""Persistent accounts, sessions, pharmacy ownership, and audit records.

Existing business rows are preserved. Existing accounts without credentials cannot log in.
"""
from alembic import op
import sqlalchemy as sa

revision = "20261023_0002"
down_revision = "20260908_0001"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("password_hash", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("is_approved", sa.Boolean(), server_default=sa.false(), nullable=False))
    op.add_column("pharmacies", sa.Column("owner_user_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_pharmacy_owner", "pharmacies", "users", ["owner_user_id"], ["id"])
    op.create_unique_constraint("uq_pharmacy_owner", "pharmacies", ["owner_user_id"])
    op.add_column("pharmacies", sa.Column("latitude", sa.Float(), nullable=True))
    op.add_column("pharmacies", sa.Column("longitude", sa.Float(), nullable=True))
    op.add_column("inventory", sa.Column("predicted_24h", sa.Integer(), nullable=True))
    op.create_check_constraint("ck_inventory_stock", "inventory", "current_stock >= 0 AND reserved_stock >= 0 AND reserved_stock <= current_stock AND reorder_level >= 0")
    op.create_check_constraint("ck_reservation_quantity", "reservations", "quantity > 0")
    op.create_table("auth_sessions",
        sa.Column("token_hash", sa.String(64), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_auth_sessions_user_id", "auth_sessions", ["user_id"])
    op.create_table("audit_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("actor_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("action", sa.String(160), nullable=False),
        sa.Column("target", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False))


def downgrade():
    op.drop_table("audit_records")
    op.drop_table("auth_sessions")
    op.drop_constraint("ck_reservation_quantity", "reservations", type_="check")
    op.drop_constraint("ck_inventory_stock", "inventory", type_="check")
    op.drop_column("inventory", "predicted_24h")
    op.drop_column("pharmacies", "longitude")
    op.drop_column("pharmacies", "latitude")
    op.drop_constraint("uq_pharmacy_owner", "pharmacies", type_="unique")
    op.drop_constraint("fk_pharmacy_owner", "pharmacies", type_="foreignkey")
    op.drop_column("pharmacies", "owner_user_id")
    op.drop_column("users", "is_approved")
    op.drop_column("users", "password_hash")
