from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from geoalchemy2 import WKTElement
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.core.access import approved_user, require_roles
from app.db.session import get_db
from app.models.inventory import Inventory
from app.models.medicine import Medicine
from app.models.pharmacy import Pharmacy
from app.models.user import User, UserRole
from app.schemas.validation import MAX_STOCK, validate_phone
from app.services.records import audit, distance_km, expire_reservations, location_data, location_type

router = APIRouter(dependencies=[Depends(approved_user)])


@router.get("/recommendations")
def recommend_pharmacies(medicine_id: int = Query(gt=0, le=MAX_STOCK), latitude: float = Query(ge=-90, le=90, allow_inf_nan=False),
                         longitude: float = Query(ge=-180, le=180, allow_inf_nan=False), quantity: int = Query(default=1, gt=0, le=MAX_STOCK),
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
                        "is_open": pharmacy.is_open, "verified": False,
                        "location_type": location_type(pharmacy), "latitude": pharmacy.latitude,
                        "longitude": pharmacy.longitude, "updated_at": row.last_updated_at.isoformat()})
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
                     "latitude": pharmacy.latitude, "longitude": pharmacy.longitude, "location_type": location_type(pharmacy)})
    db.commit()
    return rows


operator = require_roles(UserRole.PHARMACIST, UserRole.HOSPITAL_STAFF, UserRole.ADMIN)


@router.get("/mine")
def my_location(user: User = Depends(operator), db: Session = Depends(get_db)):
    location = db.scalar(select(Pharmacy).where(Pharmacy.owner_user_id == user.id))
    return location_data(location) if location else None


class PharmacyUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, allow_inf_nan=False)
    is_open: bool
    opening_hours: str = Field(default="", max_length=255)
    name: str | None = Field(default=None, min_length=1, max_length=160)
    area: str | None = Field(default=None, min_length=1, max_length=255)
    contact_number: str | None = Field(default=None, min_length=1, max_length=32)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    @field_validator("contact_number")
    @classmethod
    def valid_contact(cls, value):
        return validate_phone(value) if value is not None else None


@router.patch("/mine")
def update_pharmacy(payload: PharmacyUpdate, user: User = Depends(operator), db: Session = Depends(get_db)):
    location = db.scalar(select(Pharmacy).where(Pharmacy.owner_user_id == user.id).with_for_update())
    if location is None:
        raise HTTPException(404, "Add inventory to register your institution first")
    for field, value in payload.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(location, "address" if field == "area" else field, value)
    if location.latitude is not None and location.longitude is not None:
        location.location = WKTElement(f"POINT({location.longitude} {location.latitude})", srid=4326)
    audit(db, user, "Updated medicine location", location.name)
    db.commit()
    return location_data(location)
