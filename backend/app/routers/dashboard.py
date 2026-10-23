from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.access import require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.reservation import ReservationStatus
from app.services.rebalancing import suggestions
from app.services.records import expire_reservations, inventory_query, reservation_query

router = APIRouter()


@router.get("/summary")
def summary(user: User = Depends(require_roles(UserRole.PHARMACIST, UserRole.ADMIN)), db: Session = Depends(get_db)):
    expire_reservations(db)
    items = db.scalars(inventory_query(user)).all()
    reservations = db.scalars(reservation_query(user)).all()
    result = {"active_medicines": len({item.medicine_id for item in items}),
              "low_stock_risk": sum(item.current_stock-item.reserved_stock <= item.reorder_level*2 for item in items),
              "pending_reservations": sum(row.status in (ReservationStatus.PENDING, ReservationStatus.CONFIRMED) for row in reservations),
              "transfer_suggestions": len(suggestions(db, user)), "api_mode": "database"}
    db.commit()
    return result
