from fastapi import APIRouter

from app.schemas.demo import ReservationCreate, ReservationItem
from app.services.demo_data import RESERVATIONS


router = APIRouter()


@router.get("", response_model=list[ReservationItem])
def list_reservations() -> list[ReservationItem]:
    return RESERVATIONS


@router.post("", response_model=ReservationItem, status_code=201)
def create_reservation(payload: ReservationCreate) -> ReservationItem:
    return ReservationItem(
        id=f"R-{1024 + len(RESERVATIONS) + 1}",
        patient=payload.patient,
        medicine=payload.medicine,
        quantity=payload.quantity,
        eta="15 min",
        status=f"Reserved at {payload.pharmacy_name}",
    )
