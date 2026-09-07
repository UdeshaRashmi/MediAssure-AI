"""Create core pharmacy schema

Revision ID: 20260908_0001
Revises:
Create Date: 2026-09-08 00:00:00.000000

"""
from collections.abc import Sequence

from alembic import op
import geoalchemy2
import sqlalchemy as sa


revision: str = "20260908_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    criticality_level = sa.Enum(
        "LOW",
        "MEDIUM",
        "HIGH",
        "EMERGENCY",
        name="criticality_level",
    )
    emergency_request_status = sa.Enum(
        "OPEN",
        "RESERVED",
        "FULFILLED",
        "CANCELLED",
        name="emergency_request_status",
    )
    prediction_type = sa.Enum(
        "DEMAND",
        "STOCK_OUT_RISK",
        "AVAILABILITY_ON_ARRIVAL",
        name="prediction_type",
    )
    reservation_status = sa.Enum(
        "PENDING",
        "CONFIRMED",
        "COMPLETED",
        "CANCELLED",
        "EXPIRED",
        name="reservation_status",
    )
    stock_transfer_status = sa.Enum(
        "RECOMMENDED",
        "APPROVED",
        "REJECTED",
        "COMPLETED",
        name="stock_transfer_status",
    )
    urgency_level = sa.Enum("low", "medium", "high", "critical", name="urgency_level")
    user_role = sa.Enum("USER", "PHARMACIST", "HOSPITAL_STAFF", "ADMIN", name="user_role")

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=32), nullable=True),
        sa.Column("role", user_role, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)

    op.create_table(
        "pharmacies",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("registration_number", sa.String(length=80), nullable=True),
        sa.Column("address", sa.String(length=255), nullable=False),
        sa.Column("location", geoalchemy2.types.Geometry(geometry_type="POINT", srid=4326), nullable=True),
        sa.Column("opening_hours", sa.String(length=255), nullable=True),
        sa.Column("contact_number", sa.String(length=32), nullable=True),
        sa.Column("is_open", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("registration_number"),
    )
    op.create_index(op.f("ix_pharmacies_id"), "pharmacies", ["id"], unique=False)
    op.create_index(op.f("ix_pharmacies_name"), "pharmacies", ["name"], unique=False)

    op.create_table(
        "medicines",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("generic_name", sa.String(length=160), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("dosage_form", sa.String(length=80), nullable=True),
        sa.Column("strength", sa.String(length=80), nullable=True),
        sa.Column("requires_prescription", sa.Boolean(), nullable=False),
        sa.Column("criticality_level", criticality_level, nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_medicines_generic_name"), "medicines", ["generic_name"], unique=False)
    op.create_index(op.f("ix_medicines_id"), "medicines", ["id"], unique=False)
    op.create_index(op.f("ix_medicines_name"), "medicines", ["name"], unique=False)

    op.create_table(
        "inventory",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("pharmacy_id", sa.Integer(), nullable=False),
        sa.Column("medicine_id", sa.Integer(), nullable=False),
        sa.Column("current_stock", sa.Integer(), nullable=False),
        sa.Column("reserved_stock", sa.Integer(), nullable=False),
        sa.Column("reorder_level", sa.Integer(), nullable=False),
        sa.Column("last_updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["medicine_id"], ["medicines.id"]),
        sa.ForeignKeyConstraint(["pharmacy_id"], ["pharmacies.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("pharmacy_id", "medicine_id", name="uq_inventory_pharmacy_medicine"),
    )
    op.create_index(op.f("ix_inventory_id"), "inventory", ["id"], unique=False)
    op.create_index(op.f("ix_inventory_medicine_id"), "inventory", ["medicine_id"], unique=False)
    op.create_index(op.f("ix_inventory_pharmacy_id"), "inventory", ["pharmacy_id"], unique=False)

    op.create_table(
        "sales_history",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("pharmacy_id", sa.Integer(), nullable=False),
        sa.Column("medicine_id", sa.Integer(), nullable=False),
        sa.Column("quantity_sold", sa.Integer(), nullable=False),
        sa.Column("sold_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["medicine_id"], ["medicines.id"]),
        sa.ForeignKeyConstraint(["pharmacy_id"], ["pharmacies.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sales_history_id"), "sales_history", ["id"], unique=False)
    op.create_index(op.f("ix_sales_history_medicine_id"), "sales_history", ["medicine_id"], unique=False)
    op.create_index(op.f("ix_sales_history_pharmacy_id"), "sales_history", ["pharmacy_id"], unique=False)

    op.create_table(
        "reservations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("pharmacy_id", sa.Integer(), nullable=False),
        sa.Column("medicine_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("status", reservation_status, nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["medicine_id"], ["medicines.id"]),
        sa.ForeignKeyConstraint(["pharmacy_id"], ["pharmacies.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_reservations_id"), "reservations", ["id"], unique=False)
    op.create_index(op.f("ix_reservations_medicine_id"), "reservations", ["medicine_id"], unique=False)
    op.create_index(op.f("ix_reservations_pharmacy_id"), "reservations", ["pharmacy_id"], unique=False)
    op.create_index(op.f("ix_reservations_user_id"), "reservations", ["user_id"], unique=False)

    op.create_table(
        "emergency_requests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("medicine_id", sa.Integer(), nullable=False),
        sa.Column("required_quantity", sa.Integer(), nullable=False),
        sa.Column("user_location", geoalchemy2.types.Geometry(geometry_type="POINT", srid=4326), nullable=True),
        sa.Column("urgency_level", urgency_level, nullable=False),
        sa.Column("status", emergency_request_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["medicine_id"], ["medicines.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_emergency_requests_id"), "emergency_requests", ["id"], unique=False)
    op.create_index(op.f("ix_emergency_requests_medicine_id"), "emergency_requests", ["medicine_id"], unique=False)
    op.create_index(op.f("ix_emergency_requests_user_id"), "emergency_requests", ["user_id"], unique=False)

    op.create_table(
        "predictions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("pharmacy_id", sa.Integer(), nullable=False),
        sa.Column("medicine_id", sa.Integer(), nullable=False),
        sa.Column("prediction_type", prediction_type, nullable=False),
        sa.Column("prediction_window", sa.String(length=40), nullable=False),
        sa.Column("predicted_value", sa.Float(), nullable=False),
        sa.Column("confidence_score", sa.Float(), nullable=False),
        sa.Column("model_version", sa.String(length=80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["medicine_id"], ["medicines.id"]),
        sa.ForeignKeyConstraint(["pharmacy_id"], ["pharmacies.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_predictions_id"), "predictions", ["id"], unique=False)
    op.create_index(op.f("ix_predictions_medicine_id"), "predictions", ["medicine_id"], unique=False)
    op.create_index(op.f("ix_predictions_pharmacy_id"), "predictions", ["pharmacy_id"], unique=False)
    op.create_index(op.f("ix_predictions_prediction_type"), "predictions", ["prediction_type"], unique=False)

    op.create_table(
        "stock_transfers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("from_pharmacy_id", sa.Integer(), nullable=False),
        sa.Column("to_pharmacy_id", sa.Integer(), nullable=False),
        sa.Column("medicine_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("recommendation_reason", sa.String(length=500), nullable=True),
        sa.Column("status", stock_transfer_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["from_pharmacy_id"], ["pharmacies.id"]),
        sa.ForeignKeyConstraint(["medicine_id"], ["medicines.id"]),
        sa.ForeignKeyConstraint(["to_pharmacy_id"], ["pharmacies.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_stock_transfers_from_pharmacy_id"), "stock_transfers", ["from_pharmacy_id"], unique=False)
    op.create_index(op.f("ix_stock_transfers_id"), "stock_transfers", ["id"], unique=False)
    op.create_index(op.f("ix_stock_transfers_medicine_id"), "stock_transfers", ["medicine_id"], unique=False)
    op.create_index(op.f("ix_stock_transfers_to_pharmacy_id"), "stock_transfers", ["to_pharmacy_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_stock_transfers_to_pharmacy_id"), table_name="stock_transfers")
    op.drop_index(op.f("ix_stock_transfers_medicine_id"), table_name="stock_transfers")
    op.drop_index(op.f("ix_stock_transfers_id"), table_name="stock_transfers")
    op.drop_index(op.f("ix_stock_transfers_from_pharmacy_id"), table_name="stock_transfers")
    op.drop_table("stock_transfers")

    op.drop_index(op.f("ix_predictions_prediction_type"), table_name="predictions")
    op.drop_index(op.f("ix_predictions_pharmacy_id"), table_name="predictions")
    op.drop_index(op.f("ix_predictions_medicine_id"), table_name="predictions")
    op.drop_index(op.f("ix_predictions_id"), table_name="predictions")
    op.drop_table("predictions")

    op.drop_index(op.f("ix_emergency_requests_user_id"), table_name="emergency_requests")
    op.drop_index(op.f("ix_emergency_requests_medicine_id"), table_name="emergency_requests")
    op.drop_index(op.f("ix_emergency_requests_id"), table_name="emergency_requests")
    op.drop_table("emergency_requests")

    op.drop_index(op.f("ix_reservations_user_id"), table_name="reservations")
    op.drop_index(op.f("ix_reservations_pharmacy_id"), table_name="reservations")
    op.drop_index(op.f("ix_reservations_medicine_id"), table_name="reservations")
    op.drop_index(op.f("ix_reservations_id"), table_name="reservations")
    op.drop_table("reservations")

    op.drop_index(op.f("ix_sales_history_pharmacy_id"), table_name="sales_history")
    op.drop_index(op.f("ix_sales_history_medicine_id"), table_name="sales_history")
    op.drop_index(op.f("ix_sales_history_id"), table_name="sales_history")
    op.drop_table("sales_history")

    op.drop_index(op.f("ix_inventory_pharmacy_id"), table_name="inventory")
    op.drop_index(op.f("ix_inventory_medicine_id"), table_name="inventory")
    op.drop_index(op.f("ix_inventory_id"), table_name="inventory")
    op.drop_table("inventory")

    op.drop_index(op.f("ix_medicines_name"), table_name="medicines")
    op.drop_index(op.f("ix_medicines_id"), table_name="medicines")
    op.drop_index(op.f("ix_medicines_generic_name"), table_name="medicines")
    op.drop_table("medicines")

    op.drop_index(op.f("ix_pharmacies_name"), table_name="pharmacies")
    op.drop_index(op.f("ix_pharmacies_id"), table_name="pharmacies")
    op.drop_table("pharmacies")

    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

    bind = op.get_bind()
    for enum_name in (
        "user_role",
        "urgency_level",
        "stock_transfer_status",
        "reservation_status",
        "prediction_type",
        "emergency_request_status",
        "criticality_level",
    ):
        sa.Enum(name=enum_name).drop(bind, checkfirst=True)
