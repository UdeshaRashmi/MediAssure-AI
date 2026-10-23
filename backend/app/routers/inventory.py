from fastapi import APIRouter, HTTPException

from app.schemas.demo import ForecastItem, InventoryCreate, InventoryItem
from app.services.demo_data import AUDIT_EVENTS, FORECASTS, INVENTORY, STORE_LOCK
from app.schemas.demo import AuditEvent
from app.services.inventory import refresh_pharmacy


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


@router.post("", response_model=InventoryItem, status_code=201)
def create_inventory_item(payload: InventoryCreate) -> InventoryItem:
    with STORE_LOCK:
        return _create_inventory_item(payload)


def _create_inventory_item(payload: InventoryCreate) -> InventoryItem:
    if any(item.medicine.casefold() == payload.medicine.casefold()
           and item.pharmacy_name.casefold() == payload.pharmacy_name.casefold() for item in INVENTORY):
        raise HTTPException(status_code=409, detail="Medicine already exists at this pharmacy")
    available = payload.stock - payload.reserved
    status = "Low" if available <= payload.reorder_level else "Watch" if available <= payload.reorder_level * 2 else "Healthy"
    risk = "High" if status == "Low" else "Medium" if status == "Watch" else "Low"
    item = InventoryItem(
        pharmacy_name=payload.pharmacy_name,
        area=payload.area,
        contact_number=payload.contact_number,
        latitude=payload.latitude,
        longitude=payload.longitude,
        medicine=payload.medicine,
        generic=payload.generic,
        category=payload.category,
        stock=payload.stock,
        reserved=payload.reserved,
        reorder_level=payload.reorder_level,
        predicted_24h=payload.predicted_24h,
        status=status,
        risk=risk,
        updated="just now",
    )
    INVENTORY.append(item)

    refresh_pharmacy(payload.pharmacy_name)
    stock_health = min(100, round(available / max(payload.reorder_level * 2, 1) * 100))

    FORECASTS.append(
        ForecastItem(
            medicine=payload.medicine,
            next_24h=payload.predicted_24h,
            next_72h=payload.predicted_24h * 3,
            stockout_risk=100 - stock_health,
            trend="Rising" if payload.predicted_24h > payload.stock else "Stable",
            driver="Generated from backend inventory entry",
        )
    )
    AUDIT_EVENTS.append(
        AuditEvent(
            actor=payload.pharmacy_name,
            action="Added inventory stock",
            target=payload.medicine,
            time="just now",
            tone="teal",
        )
    )

    return item
