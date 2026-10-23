from datetime import UTC, datetime
from math import asin, cos, radians, sin, sqrt
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.audit import AuditRecord
from app.models.inventory import Inventory
from app.models.pharmacy import Pharmacy
from app.models.reservation import Reservation, ReservationStatus
from app.models.user import User, UserRole


def audit(db: Session, user: User, action: str, target: str):
    db.add(AuditRecord(actor_id=user.id, action=action, target=target))


def inventory_query(user: User | None = None):
    query = select(Inventory).join(Pharmacy)
    if user and user.role == UserRole.PHARMACIST:
        query = query.where(Pharmacy.owner_user_id == user.id)
    return query.order_by(Inventory.id)


def inventory_data(item: Inventory):
    available = item.current_stock - item.reserved_stock
    status = "Low" if available <= item.reorder_level else "Watch" if available <= item.reorder_level * 2 else "Healthy"
    return {"id": item.id, "medicine_id": item.medicine_id, "pharmacy_id": item.pharmacy_id,
            "pharmacy_name": item.pharmacy.name, "medicine": item.medicine.name,
            "generic": item.medicine.generic_name, "category": item.medicine.category or "",
            "stock": item.current_stock, "reserved": item.reserved_stock, "reorder_level": item.reorder_level,
            "predicted_24h": item.predicted_24h or 0, "status": status,
            "risk": {"Low": "High", "Watch": "Medium", "Healthy": "Low"}[status],
            "updated": item.last_updated_at.isoformat()}


def reservation_query(user: User):
    query = select(Reservation).join(Pharmacy)
    if user.role == UserRole.PHARMACIST:
        query = query.where(Pharmacy.owner_user_id == user.id)
    elif user.role != UserRole.ADMIN:
        query = query.where(Reservation.user_id == user.id)
    return query.order_by(Reservation.id.desc())


def reservation_data(item: Reservation):
    return {"id": str(item.id), "patient": item.user.name, "medicine": item.medicine.name,
            "pharmacy_name": item.pharmacy.name, "quantity": item.quantity,
            "eta": item.expires_at.isoformat(), "expires_at": item.expires_at.isoformat(),
            "status": item.status.value.title()}


def expire_reservations(db: Session):
    # Consistent row locking prevents duplicate releases on concurrent requests.
    rows = db.scalars(select(Reservation).where(
        Reservation.status.in_([ReservationStatus.PENDING, ReservationStatus.CONFIRMED]),
        Reservation.expires_at <= datetime.now(UTC)).order_by(Reservation.id).with_for_update()).all()
    for row in rows:
        stock = db.scalar(select(Inventory).where(Inventory.pharmacy_id == row.pharmacy_id,
                          Inventory.medicine_id == row.medicine_id).with_for_update())
        if stock:
            stock.reserved_stock -= row.quantity
        row.status = ReservationStatus.EXPIRED
    db.flush()


def distance_km(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(radians, (lat1, lon1, lat2, lon2))
    value = sin((lat2-lat1)/2)**2 + cos(lat1)*cos(lat2)*sin((lon2-lon1)/2)**2
    return 6371 * 2 * asin(sqrt(min(1, max(0, value))))
