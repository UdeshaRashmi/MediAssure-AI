from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.access import approved_user, require_roles
from app.db.session import get_db
from app.models.inventory import Inventory
from app.models.medicine import Medicine
from app.models.pharmacy import Pharmacy
from app.models.user import User, UserRole
from app.services.records import distance_km, expire_reservations

router = APIRouter(dependencies=[Depends(approved_user)])


@router.get("/recommendations")
def recommend_pharmacies(medicine_id: int = Query(gt=0), latitude: float = Query(ge=-90, le=90),
                         longitude: float = Query(ge=-180, le=180), quantity: int = Query(default=1, gt=0),
                         db: Session = Depends(get_db)):
    expire_reservations(db)
    if db.get(Medicine, medicine_id) is None:
        raise HTTPException(404, "Medicine not found")
    matches = []
    for row in db.scalars(select(Inventory).where(Inventory.medicine_id == medicine_id)):
        available = row.current_stock - row.reserved_stock
        pharmacy = row.pharmacy
        if available < quantity or not pharmacy.is_open or pharmacy.latitude is None or pharmacy.longitude is None:
            continue
        distance = distance_km(latitude, longitude, pharmacy.latitude, pharmacy.longitude)
        confidence = min(.99, available / max(row.current_stock, 1))
        matches.append({"id": row.id, "name": pharmacy.name, "area": pharmacy.address,
                        "distance_km": round(distance, 2), "travel_time_minutes": max(1, round(distance / 25 * 60)),
                        "contact_number": pharmacy.contact_number or "", "current_stock": available,
                        "availability_confidence": confidence, "emergency_rescue_score": round(confidence * 100 / (1 + distance / 10), 2),
                        "is_open": pharmacy.is_open, "verified": False})
    db.commit()
    return sorted(matches, key=lambda item: item["emergency_rescue_score"], reverse=True)


@router.get("")
def list_pharmacies(db: Session = Depends(get_db)):
    expire_reservations(db)
    rows = []
    for pharmacy in db.scalars(select(Pharmacy).order_by(Pharmacy.id)):
        items = pharmacy.inventory_items
        health = round(sum(min(100, (i.current_stock - i.reserved_stock) / max(i.reorder_level * 2, 1) * 100) for i in items) / len(items)) if items else 0
        rows.append({"id": pharmacy.id, "name": pharmacy.name, "area": pharmacy.address,
                     "status": "Online" if pharmacy.is_open else "Offline", "open_until": pharmacy.opening_hours or "Not provided",
                     "stock_health": health, "urgent_gaps": sum(max(0, i.reorder_level - (i.current_stock-i.reserved_stock)) for i in items),
                     "last_sync": max((i.last_updated_at.isoformat() for i in items), default=pharmacy.created_at.isoformat()),
                     "latitude": pharmacy.latitude, "longitude": pharmacy.longitude})
    db.commit()
    return rows


from pydantic import BaseModel, Field
class PharmacyUpdate(BaseModel):
    is_open: bool
    opening_hours: str = Field(default="", max_length=255)


@router.patch("/mine")
def update_pharmacy(payload: PharmacyUpdate, user: User = Depends(require_roles(UserRole.PHARMACIST, UserRole.ADMIN)), db: Session = Depends(get_db)):
    pharmacy = db.scalar(select(Pharmacy).where(Pharmacy.owner_user_id == user.id))
    if pharmacy is None:
        raise HTTPException(404, "Add inventory to register your pharmacy first")
    pharmacy.is_open, pharmacy.opening_hours = payload.is_open, payload.opening_hours
    db.commit()
    return {"is_open": pharmacy.is_open, "opening_hours": pharmacy.opening_hours}
