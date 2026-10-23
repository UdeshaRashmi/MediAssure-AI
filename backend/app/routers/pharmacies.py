from math import asin, cos, radians, sin, sqrt

from fastapi import APIRouter, HTTPException, Query

from app.schemas.demo import NetworkPharmacy, PharmacyRecommendation
from app.services.demo_data import INVENTORY, NETWORK, STORE_LOCK

router = APIRouter()


def distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    lat1, lon1, lat2, lon2 = map(radians, (lat1, lon1, lat2, lon2))
    value = sin((lat2 - lat1) / 2) ** 2 + cos(lat1) * cos(lat2) * sin((lon2 - lon1) / 2) ** 2
    return 6371 * 2 * asin(sqrt(min(1, max(0, value))))


@router.get("/recommendations", response_model=list[PharmacyRecommendation])
def recommend_pharmacies(
    medicine_id: int = Query(gt=0),
    latitude: float = Query(ge=-90, le=90),
    longitude: float = Query(ge=-180, le=180),
    quantity: int = Query(default=1, gt=0),
) -> list[PharmacyRecommendation]:
    with STORE_LOCK:
        if medicine_id > len(INVENTORY):
            raise HTTPException(status_code=404, detail="Medicine not found")
        medicine = INVENTORY[medicine_id - 1].medicine.casefold()
        matches = []
        for index, item in enumerate(INVENTORY, start=1):
            available = item.stock - item.reserved
            if item.medicine.casefold() != medicine or available < quantity:
                continue
            distance = distance_km(latitude, longitude, item.latitude, item.longitude)
            # Stock-based prototype estimate; no trained prediction or verification.
            confidence = min(0.99, available / max(item.stock, 1))
            matches.append(PharmacyRecommendation(
                id=index, name=item.pharmacy_name, area=item.area,
                distance_km=round(distance, 2), travel_time_minutes=max(1, round(distance / 25 * 60)),
                contact_number=item.contact_number, current_stock=available,
                availability_confidence=confidence,
                emergency_rescue_score=round(confidence * 100 / (1 + distance / 10), 2),
                is_open=False, verified=False,
            ))
        return sorted(matches, key=lambda item: item.emergency_rescue_score, reverse=True)


@router.get("", response_model=list[NetworkPharmacy])
def list_pharmacies() -> list[NetworkPharmacy]:
    return NETWORK
