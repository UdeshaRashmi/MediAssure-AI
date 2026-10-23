from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.access import approved_user, require_roles
from app.db.session import get_db
from app.models.audit import AuditRecord
from app.models.user import User, UserRole
from app.services.records import expire_reservations, inventory_query

router = APIRouter()
operator = require_roles(UserRole.PHARMACIST, UserRole.ADMIN)


@router.get("/forecasts", dependencies=[Depends(operator)])
def forecasts():
    # No model is deployed; never present fabricated predictions as real data.
    return []


@router.get("/transfers", dependencies=[Depends(operator)])
def transfers():
    return []


@router.get("/verified-alternatives", dependencies=[Depends(approved_user)])
def alternatives():
    return []


@router.get("/alerts")
def alerts(user: User = Depends(require_roles(UserRole.PHARMACIST, UserRole.HOSPITAL_STAFF, UserRole.ADMIN)), db: Session = Depends(get_db)):
    expire_reservations(db)
    result = []
    for item in db.scalars(inventory_query(user)):
        if item.current_stock - item.reserved_stock <= item.reorder_level:
            result.append({"title": item.medicine.name, "detail": f"{item.pharmacy.name}: {item.current_stock-item.reserved_stock} available units", "tone": "danger"})
    db.commit()
    return result


@router.get("/audit-events")
def audit_events(user: User = Depends(approved_user), db: Session = Depends(get_db)):
    query = select(AuditRecord).order_by(AuditRecord.id.desc()).limit(100)
    if user.role != UserRole.ADMIN:
        query = query.where(AuditRecord.actor_id == user.id)
    return [{"actor": db.get(User, row.actor_id).name, "action": row.action, "target": row.target,
             "time": row.created_at.isoformat(), "tone": "teal"} for row in db.scalars(query)]
