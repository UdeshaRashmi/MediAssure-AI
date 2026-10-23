from fastapi import APIRouter, Depends
from sqlalchemy import select, or_
from sqlalchemy.orm import Session
from app.core.access import approved_user
from app.db.session import get_db
from app.models.medicine import Medicine

router = APIRouter(dependencies=[Depends(approved_user)])


def medicine_data(row):
    return {"id": row.id, "name": row.name, "generic_name": row.generic_name,
            "category": row.category or "", "strength": row.strength or "",
            "requires_prescription": row.requires_prescription, "criticality_level": row.criticality_level.value}


@router.get("/search")
def search_medicines(query: str, db: Session = Depends(get_db)):
    term = query.strip()
    if not term:
        return []
    pattern = "%" + term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"
    rows = db.scalars(select(Medicine).where(or_(Medicine.name.ilike(pattern, escape="\\"),
                      Medicine.generic_name.ilike(pattern, escape="\\"), Medicine.category.ilike(pattern, escape="\\"))).order_by(Medicine.id))
    return [medicine_data(row) for row in rows]


@router.get("")
def list_medicines(db: Session = Depends(get_db)):
    return [medicine_data(row) for row in db.scalars(select(Medicine).order_by(Medicine.id))]
