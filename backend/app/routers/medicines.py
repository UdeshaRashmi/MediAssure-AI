from fastapi import APIRouter

from app.schemas.demo import MedicineSearchResult
from app.services.demo_data import INVENTORY

router = APIRouter()


@router.get("/search", response_model=list[MedicineSearchResult])
def search_medicines(query: str) -> list[MedicineSearchResult]:
    sample_medicines = [
        MedicineSearchResult(
            id=index + 1,
            name=item.medicine,
            generic_name=item.generic,
            category=item.category,
            strength=extract_strength(item.medicine),
            requires_prescription=item.risk in {"High", "Medium"},
            criticality_level=item.risk.lower(),
        )
        for index, item in enumerate(INVENTORY)
    ]

    normalized_query = query.lower().strip()
    return [
        medicine
        for medicine in sample_medicines
        if normalized_query in medicine.name.lower()
        or normalized_query in medicine.generic_name.lower()
        or normalized_query in medicine.category.lower()
    ]


@router.get("", response_model=list[MedicineSearchResult])
def list_medicines() -> list[MedicineSearchResult]:
    return [
        MedicineSearchResult(
            id=index + 1,
            name=item.medicine,
            generic_name=item.generic,
            category=item.category,
            strength=extract_strength(item.medicine),
            requires_prescription=item.risk in {"High", "Medium"},
            criticality_level=item.risk.lower(),
        )
        for index, item in enumerate(INVENTORY)
    ]


def extract_strength(name: str) -> str:
    if "500 mg" in name:
        return "500 mg"
    if "Inhaler" in name:
        return "100 mcg"
    return "standard"
