from fastapi import APIRouter
from pydantic import BaseModel


router = APIRouter()


class PharmacyRecommendation(BaseModel):
    id: int
    name: str
    distance_km: float
    travel_time_minutes: int
    current_stock: int
    availability_confidence: float
    emergency_rescue_score: float
    is_open: bool


@router.get("/recommendations", response_model=list[PharmacyRecommendation])
def recommend_pharmacies(
    medicine_id: int,
    latitude: float,
    longitude: float,
    quantity: int = 1,
) -> list[PharmacyRecommendation]:
    _ = (medicine_id, latitude, longitude, quantity)

    return [
        PharmacyRecommendation(
            id=2,
            name="City Care Pharmacy",
            distance_km=2.5,
            travel_time_minutes=9,
            current_stock=10,
            availability_confidence=0.95,
            emergency_rescue_score=91.0,
            is_open=True,
        ),
        PharmacyRecommendation(
            id=1,
            name="Nearest Meds",
            distance_km=1.0,
            travel_time_minutes=5,
            current_stock=1,
            availability_confidence=0.30,
            emergency_rescue_score=42.0,
            is_open=True,
        ),
    ]

