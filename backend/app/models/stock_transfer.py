from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class StockTransferStatus(StrEnum):
    RECOMMENDED = "recommended"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"


class StockTransfer(Base):
    __tablename__ = "stock_transfers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    from_pharmacy_id: Mapped[int] = mapped_column(ForeignKey("pharmacies.id"), index=True)
    to_pharmacy_id: Mapped[int] = mapped_column(ForeignKey("pharmacies.id"), index=True)
    medicine_id: Mapped[int] = mapped_column(ForeignKey("medicines.id"), index=True)
    quantity: Mapped[int] = mapped_column(Integer)
    recommendation_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[StockTransferStatus] = mapped_column(
        Enum(StockTransferStatus, name="stock_transfer_status"),
        default=StockTransferStatus.RECOMMENDED,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    from_pharmacy = relationship("Pharmacy", foreign_keys=[from_pharmacy_id])
    to_pharmacy = relationship("Pharmacy", foreign_keys=[to_pharmacy_id])
    medicine = relationship("Medicine")

