from fastapi import APIRouter, HTTPException

from app.schemas.demo import ReservationCreate, ReservationItem
from app.services.demo_data import INVENTORY, RESERVATIONS, STORE_LOCK

from app.services.inventory import refresh_pharmacy

router = APIRouter()


@router.get("", response_model=list[ReservationItem])
def list_reservations() -> list[ReservationItem]:
    with STORE_LOCK:
        return list(RESERVATIONS)


@router.post("", response_model=ReservationItem, status_code=201)
def create_reservation(payload: ReservationCreate) -> ReservationItem:
    with STORE_LOCK:
        stock = next((item for item in INVENTORY
                      if item.medicine.casefold() == payload.medicine.casefold()
                      and item.pharmacy_name.casefold() == payload.pharmacy_name.casefold()), None)
        if stock is None:
            raise HTTPException(status_code=404, detail="Medicine not found at this pharmacy")
        if stock.stock - stock.reserved < payload.quantity:
            raise HTTPException(status_code=409, detail="Insufficient available stock")
        reservation = ReservationItem(
            id=f"R-{1025 + len(RESERVATIONS)}", patient=payload.patient,
            medicine=stock.medicine, quantity=payload.quantity,
            eta="Awaiting pharmacy confirmation", status=f"Pending at {stock.pharmacy_name}",
        )
        stock.reserved += payload.quantity
        available = stock.stock - stock.reserved
        stock.status = "Low" if available <= stock.reorder_level else "Watch" if available <= stock.reorder_level * 2 else "Healthy"
        stock.risk = {"Low": "High", "Watch": "Medium", "Healthy": "Low"}[stock.status]
        refresh_pharmacy(stock.pharmacy_name)
        RESERVATIONS.append(reservation)
        return reservation
