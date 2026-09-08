from fastapi import APIRouter

from app.schemas.demo import ForecastItem, InventoryCreate, InventoryItem, NetworkPharmacy, PharmacyRecommendation
from app.services.demo_data import AUDIT_EVENTS, FORECASTS, INVENTORY, NETWORK, RECOMMENDATIONS
from app.schemas.demo import AuditEvent


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
    status = "Low" if payload.stock <= payload.reorder_level else "Watch" if payload.stock <= payload.reorder_level * 2 else "Healthy"
    risk = "High" if status == "Low" else "Medium" if status == "Watch" else "Low"
    item = InventoryItem(
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

    stock_health = min(100, max(0, round((payload.stock / max(payload.reorder_level * 2, 1)) * 100)))
    urgent_gaps = max(0, payload.reorder_level - (payload.stock - payload.reserved))
    NETWORK.append(
        NetworkPharmacy(
            name=payload.pharmacy_name,
            area=payload.area,
            status="Online",
            open_until="10:00 PM",
            stock_health=stock_health,
            urgent_gaps=urgent_gaps,
            last_sync="just now",
            latitude=payload.latitude,
            longitude=payload.longitude,
        )
    )

    confidence = min(0.99, max(0.2, (payload.stock - payload.reserved) / max(payload.stock, 1)))
    RECOMMENDATIONS.append(
        PharmacyRecommendation(
            id=len(RECOMMENDATIONS) + 1,
            name=payload.pharmacy_name,
            area=payload.area,
            distance_km=2.0,
            travel_time_minutes=12,
            contact_number=payload.contact_number,
            current_stock=payload.stock,
            availability_confidence=confidence,
            emergency_rescue_score=round(confidence * 100),
            is_open=True,
            verified=True,
        )
    )

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
