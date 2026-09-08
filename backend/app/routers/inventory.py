from fastapi import APIRouter

from app.schemas.demo import InventoryItem
from app.services.demo_data import INVENTORY


router = APIRouter()


@router.get("", response_model=list[InventoryItem])
def list_inventory(status: str | None = None, query: str | None = None) -> list[InventoryItem]:
    items = INVENTORY

    if status:
        items = [item for item in items if item.status.lower() == status.lower()]

    if query:
        normalized_query = query.lower().strip()
        items = [
            item
            for item in items
            if normalized_query in item.medicine.lower()
            or normalized_query in item.generic.lower()
            or normalized_query in item.category.lower()
        ]

    return items
