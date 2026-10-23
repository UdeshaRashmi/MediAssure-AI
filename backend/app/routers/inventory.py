from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select, func
from geoalchemy2 import WKTElement
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict, Field
from app.core.access import require_roles
from app.db.session import get_db
from app.models.inventory import Inventory
from app.models.medicine import Medicine
from app.models.pharmacy import Pharmacy
from app.models.user import User, UserRole
from app.schemas.inventory import InventoryCreate
from app.schemas.validation import MAX_STOCK
from app.services.records import audit, expire_reservations, inventory_data, inventory_query

router = APIRouter()
operator = require_roles(UserRole.PHARMACIST, UserRole.HOSPITAL_STAFF, UserRole.ADMIN)


@router.get("")
def list_inventory(status: str | None = None, query: str | None = None,
                   user: User = Depends(operator), db: Session = Depends(get_db)):
    expire_reservations(db)
    items = [inventory_data(row) for row in db.scalars(inventory_query(user)).all()]
    db.commit()
    if status:
        items = [item for item in items if item["status"].casefold() == status.casefold()]
    if query:
        term = query.strip().casefold()
        items = [item for item in items if any(term in item[key].casefold() for key in ("medicine", "generic", "category"))]
    return items


@router.post("", status_code=201)
def create_inventory_item(payload: InventoryCreate, user: User = Depends(operator), db: Session = Depends(get_db)):
    if payload.reserved:
        raise HTTPException(422, "Reserved stock is managed through reservations")
    pharmacy = db.scalar(select(Pharmacy).where(Pharmacy.owner_user_id == user.id).with_for_update())
    if pharmacy is None:
        pharmacy = Pharmacy(owner_user_id=user.id, name=payload.pharmacy_name,
                            address=payload.area, latitude=payload.latitude, longitude=payload.longitude,
                            contact_number=payload.contact_number, is_open=payload.is_open,
                            opening_hours=payload.opening_hours,
                            location=WKTElement(f"POINT({payload.longitude} {payload.latitude})", srid=4326))
        db.add(pharmacy)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            raise HTTPException(409, "Institution setup changed; retry the request") from None
    elif pharmacy.name.casefold() != payload.pharmacy_name.casefold():
        raise HTTPException(409, "Use your registered institution name")
    medicine = db.scalar(select(Medicine).where(func.lower(Medicine.name) == payload.medicine.lower(),
                            func.lower(Medicine.strength) == payload.strength.lower(), func.lower(Medicine.generic_name) == payload.generic.lower()))
    if medicine is None:
        medicine = Medicine(name=payload.medicine, generic_name=payload.generic, category=payload.category,
                            strength=payload.strength, requires_prescription=payload.requires_prescription)
        db.add(medicine)
        db.flush()
    item = Inventory(pharmacy_id=pharmacy.id, medicine_id=medicine.id, current_stock=payload.stock,
                     reserved_stock=0, reorder_level=payload.reorder_level, predicted_24h=None)
    db.add(item)
    audit(db, user, "Added inventory", payload.medicine)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Medicine already exists at your institution") from None
    return inventory_data(item)


class StockUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    medicine: str | None = Field(default=None, min_length=1, max_length=160)
    generic: str | None = Field(default=None, min_length=1, max_length=160)
    strength: str | None = Field(default=None, max_length=80)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    requires_prescription: bool | None = None
    stock: int = Field(ge=0, le=MAX_STOCK, strict=True)
    reorder_level: int = Field(ge=0, le=MAX_STOCK, strict=True)


@router.patch("/{inventory_id}")
def update_stock(inventory_id: int, payload: StockUpdate, user: User = Depends(operator), db: Session = Depends(get_db)):
    expire_reservations(db)
    item = db.scalar(inventory_query(user).where(Inventory.id == inventory_id).with_for_update(of=Inventory))
    if item is None:
        raise HTTPException(404, "Inventory not found")
    if payload.stock < item.reserved_stock:
        raise HTTPException(409, "Stock cannot be less than reserved units")
    current = item.medicine
    details = dict(name=payload.medicine if payload.medicine is not None else current.name,
                   generic_name=payload.generic if payload.generic is not None else current.generic_name,
                   strength=payload.strength if payload.strength is not None else current.strength,
                   category=payload.category if payload.category is not None else current.category,
                   requires_prescription=payload.requires_prescription if payload.requires_prescription is not None else current.requires_prescription)
    if any(getattr(current, key) != value for key, value in details.items()):
        if item.reserved_stock:
            raise HTTPException(409, "Complete or cancel active reservations before changing medicine details")
        # Shared medicine records must not change another supplier's stock or reservation history.
        medicine = db.scalar(select(Medicine).filter_by(**details).order_by(Medicine.id))
        if medicine is None:
            medicine = Medicine(**details)
            db.add(medicine)
            db.flush()
        duplicate = db.scalar(select(Inventory.id).where(Inventory.pharmacy_id == item.pharmacy_id,
                              Inventory.medicine_id == medicine.id, Inventory.id != item.id))
        if duplicate:
            raise HTTPException(409, "Medicine already exists at your institution")
        item.medicine = medicine
    item.current_stock, item.reorder_level = payload.stock, payload.reorder_level
    audit(db, user, "Updated stock", item.medicine.name)
    db.commit()
    return inventory_data(item)


@router.delete("/{inventory_id}", status_code=204)
def delete_inventory_item(inventory_id: int, user: User = Depends(operator), db: Session = Depends(get_db)):
    expire_reservations(db)
    item = db.scalar(inventory_query(user).where(Inventory.id == inventory_id).with_for_update(of=Inventory))
    if item is None:
        raise HTTPException(404, "Inventory not found")
    if item.reserved_stock:
        raise HTTPException(409, "Complete or cancel active reservations before deleting stock")
    audit(db, user, "Deleted inventory", item.medicine.name)
    db.delete(item)
    db.commit()
    return Response(status_code=204)
