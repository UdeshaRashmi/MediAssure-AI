from datetime import UTC, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.access import approved_user, require_roles
from app.db.session import get_db
from app.models.inventory import Inventory
from app.models.reservation import Reservation, ReservationStatus
from app.models.user import User, UserRole
from app.schemas.validation import MAX_STOCK
from app.services.notifications import reservation_email
from app.services.records import audit, expire_reservations, reservation_data, reservation_query

router = APIRouter()

class ReservationCreate(BaseModel):
    inventory_id: int = Field(gt=0, le=MAX_STOCK, strict=True)
    quantity: int = Field(default=1, gt=0, le=MAX_STOCK, strict=True)


@router.get("")
def list_reservations(user: User = Depends(approved_user), db: Session = Depends(get_db)):
    expire_reservations(db)
    rows = [reservation_data(row, user) for row in db.scalars(reservation_query(user)).all()]
    db.commit()
    return rows


@router.post("", status_code=201)
def create_reservation(payload: ReservationCreate,
                       user: User = Depends(require_roles(UserRole.USER, UserRole.HOSPITAL_STAFF)),
                       db: Session = Depends(get_db)):
    expire_reservations(db)
    stock = db.scalar(select(Inventory).where(Inventory.id == payload.inventory_id).with_for_update())
    if stock is None:
        raise HTTPException(404, "Inventory not found")
    if not stock.pharmacy.is_open:
        raise HTTPException(409, "Medicine location is closed")
    if stock.current_stock - stock.reserved_stock < payload.quantity:
        raise HTTPException(409, "Insufficient available stock")
    row = Reservation(user_id=user.id, pharmacy_id=stock.pharmacy_id, medicine_id=stock.medicine_id,
                      quantity=payload.quantity, status=ReservationStatus.PENDING,
                      expires_at=datetime.now(UTC) + timedelta(minutes=15))
    stock.reserved_stock += payload.quantity
    db.add(row)
    db.flush()
    reservation_email(db, row)
    audit(db, user, "Created reservation", stock.medicine.name)
    db.commit()
    return reservation_data(row, user)


class ReservationUpdate(BaseModel):
    status: ReservationStatus


@router.patch("/{reservation_id}")
def update_reservation(reservation_id: int, payload: ReservationUpdate,
                       user: User = Depends(approved_user), db: Session = Depends(get_db)):
    expire_reservations(db)
    row = db.scalar(reservation_query(user).where(Reservation.id == reservation_id).with_for_update(of=Reservation))
    if row is None:
        raise HTTPException(404, "Reservation not found")
    transitions = {ReservationStatus.PENDING: {ReservationStatus.CONFIRMED, ReservationStatus.CANCELLED},
                   ReservationStatus.CONFIRMED: {ReservationStatus.COMPLETED, ReservationStatus.CANCELLED}}
    if payload.status not in transitions.get(row.status, set()):
        raise HTTPException(409, "Invalid reservation status transition")
    can_manage = user.role == UserRole.ADMIN or row.pharmacy.owner_user_id == user.id
    if not can_manage and payload.status != ReservationStatus.CANCELLED:
        raise HTTPException(403, "Only the supplying institution can confirm or complete reservations")
    stock = db.scalar(select(Inventory).where(Inventory.pharmacy_id == row.pharmacy_id,
                      Inventory.medicine_id == row.medicine_id).with_for_update())
    if payload.status in (ReservationStatus.CANCELLED, ReservationStatus.COMPLETED):
        stock.reserved_stock -= row.quantity
        if payload.status == ReservationStatus.COMPLETED:
            stock.current_stock -= row.quantity
    row.status = payload.status
    reservation_email(db, row)
    audit(db, user, "Updated reservation", str(row.id))
    db.commit()
    return reservation_data(row, user)
