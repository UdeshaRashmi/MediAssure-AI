from datetime import datetime
from enum import StrEnum

from geoalchemy2 import Geometry
from sqlalchemy import DateTime, Enum, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class EmergencyRequestStatus(StrEnum):
    OPEN = "open"
    RESERVED = "reserved"
    FULFILLED = "fulfilled"
    CANCELLED = "cancelled"


class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    medicine_id: Mapped[int] = mapped_column(ForeignKey("medicines.id"), index=True)
    required_quantity: Mapped[int] = mapped_column(Integer)
    user_location = mapped_column(Geometry(geometry_type="POINT", srid=4326), index=True)
    urgency_level: Mapped[str] = mapped_column(Enum("low", "medium", "high", "critical", name="urgency_level"))
    status: Mapped[EmergencyRequestStatus] = mapped_column(
        Enum(EmergencyRequestStatus, name="emergency_request_status"),
        default=EmergencyRequestStatus.OPEN,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    user = relationship("User", back_populates="emergency_requests")
    medicine = relationship("Medicine")

