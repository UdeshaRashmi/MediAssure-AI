from fastapi import APIRouter
from pydantic import BaseModel


router = APIRouter()


class MedicineSearchResult(BaseModel):
    id: int
    name: str
    generic_name: str
    strength: str
    requires_prescription: bool
    criticality_level: str


@router.get("/search", response_model=list[MedicineSearchResult])
def search_medicines(query: str) -> list[MedicineSearchResult]:
    sample_medicines = [
        MedicineSearchResult(
            id=1,
            name="Salbutamol Inhaler",
            generic_name="Salbutamol",
            strength="100 mcg",
            requires_prescription=True,
            criticality_level="high",
        ),
        MedicineSearchResult(
            id=2,
            name="Paracetamol",
            generic_name="Acetaminophen",
            strength="500 mg",
            requires_prescription=False,
            criticality_level="medium",
        ),
    ]

    normalized_query = query.lower().strip()
    return [
        medicine
        for medicine in sample_medicines
        if normalized_query in medicine.name.lower()
        or normalized_query in medicine.generic_name.lower()
    ]

