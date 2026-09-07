from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Pharmacy(Base):
    __tablename__ = "pharmacies"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(160), index=True)
    registration_number: Mapped[str | None] = mapped_column(
        String(80),
        unique=True,
        nullable=True,
    )
    address: Mapped[str] = mapped_column(String(255))
    location = mapped_column(Geometry(geometry_type="POINT", srid=4326), index=True)
    opening_hours: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_number: Mapped[str | None] = mapped_column(String(32), nullable=True)
    is_open: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    inventory_items = relationship("Inventory", back_populates="pharmacy")
    sales_history = relationship("SalesHistory", back_populates="pharmacy")
    reservations = relationship("Reservation", back_populates="pharmacy")
    predictions = relationship("Prediction", back_populates="pharmacy")

