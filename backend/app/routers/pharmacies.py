from fastapi import APIRouter

from app.schemas.demo import NetworkPharmacy, PharmacyRecommendation
from app.services.demo_data import NETWORK, RECOMMENDATIONS

router = APIRouter()


@router.get("/recommendations", response_model=list[PharmacyRecommendation])
def recommend_pharmacies(
    medicine_id: int,
    latitude: float,
    longitude: float,
    quantity: int = 1,
) -> list[PharmacyRecommendation]:
    _ = (medicine_id, latitude, longitude, quantity)
    return sorted(RECOMMENDATIONS, key=lambda item: item.emergency_rescue_score, reverse=True)


@router.get("", response_model=list[NetworkPharmacy])
def list_pharmacies() -> list[NetworkPharmacy]:
    return NETWORK
