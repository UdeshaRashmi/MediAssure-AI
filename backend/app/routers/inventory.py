from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.access import require_roles
from app.db.session import get_db
from app.models.inventory import Inventory
from app.models.medicine import Medicine
from app.models.pharmacy import Pharmacy
from app.models.user import User, UserRole
from app.schemas.demo import InventoryCreate
from app.services.records import audit, expire_reservations, inventory_data, inventory_query

router = APIRouter()
operator = require_roles(UserRole.PHARMACIST, UserRole.ADMIN)


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
                            opening_hours=payload.opening_hours)
        db.add(pharmacy)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            raise HTTPException(409, "Pharmacy setup changed; retry the request") from None
    elif pharmacy.name.casefold() != payload.pharmacy_name.casefold():
        raise HTTPException(409, "Use your registered pharmacy name")
    medicine = db.scalar(select(Medicine).where(Medicine.name == payload.medicine,
                            Medicine.strength == payload.strength, Medicine.generic_name == payload.generic))
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
        raise HTTPException(409, "Medicine already exists at your pharmacy") from None
    return inventory_data(item)


from pydantic import BaseModel, Field

class StockUpdate(BaseModel):
    stock: int = Field(ge=0)
    reorder_level: int = Field(ge=0)


@router.patch("/{inventory_id}")
def update_stock(inventory_id: int, payload: StockUpdate, user: User = Depends(operator), db: Session = Depends(get_db)):
    expire_reservations(db)
    item = db.scalar(inventory_query(user).where(Inventory.id == inventory_id).with_for_update(of=Inventory))
    if item is None:
        raise HTTPException(404, "Inventory not found")
    if payload.stock < item.reserved_stock:
        raise HTTPException(409, "Stock cannot be less than reserved units")
    item.current_stock, item.reorder_level = payload.stock, payload.reorder_level
    audit(db, user, "Updated stock", item.medicine.name)
    db.commit()
    return inventory_data(item)
