from enum import StrEnum

from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class CriticalityLevel(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EMERGENCY = "emergency"


class Medicine(Base):
    __tablename__ = "medicines"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(160), index=True)
    generic_name: Mapped[str] = mapped_column(String(160), index=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    dosage_form: Mapped[str | None] = mapped_column(String(80), nullable=True)
    strength: Mapped[str | None] = mapped_column(String(80), nullable=True)
    requires_prescription: Mapped[bool] = mapped_column(Boolean, default=False)
    criticality_level: Mapped[CriticalityLevel] = mapped_column(
        Enum(CriticalityLevel, name="criticality_level"),
        default=CriticalityLevel.MEDIUM,
    )

    inventory_items = relationship("Inventory", back_populates="medicine")
    sales_history = relationship("SalesHistory", back_populates="medicine")
    reservations = relationship("Reservation", back_populates="medicine")
    predictions = relationship("Prediction", back_populates="medicine")

