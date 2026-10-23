from datetime import UTC, datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, or_
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, Field
from uuid import UUID
from sqlalchemy.orm import Session
from app.core.access import approved_user, require_roles
from app.db.session import get_db
from app.models.audit import AuditRecord
from app.models.user import User, UserRole
from app.models.inventory import Inventory
from app.models.stock_transfer import StockTransfer, StockTransferStatus
from app.models.email_message import EmailMessage
from app.schemas.validation import MAX_STOCK
from app.core.config import get_settings
from app.services.records import audit, expire_reservations, inventory_query
from app.services.rebalancing import eligible_stock, eligible_for_user, suggestions, target, transfer_data
from app.services.notifications import queue_email

router = APIRouter()
operator = require_roles(UserRole.PHARMACIST, UserRole.ADMIN)
supplier = require_roles(UserRole.PHARMACIST, UserRole.HOSPITAL_STAFF, UserRole.ADMIN)


@router.get("/forecasts", dependencies=[Depends(operator)])
def forecasts():
    # No model is deployed; never present fabricated predictions as real data.
    return []


@router.get("/transfers")
def transfers(user: User = Depends(supplier), db: Session = Depends(get_db)):
    expire_reservations(db)
    result = suggestions(db, user)
    db.commit()
    return result


@router.get("/transfer-history")
def transfer_history(user: User = Depends(supplier), db: Session = Depends(get_db)):
    query = select(StockTransfer).order_by(StockTransfer.id.desc()).limit(100)
    if user.role != UserRole.ADMIN:
        from app.models.pharmacy import Pharmacy
        owned = select(Pharmacy.id).where(Pharmacy.owner_user_id == user.id)
        query = query.where(or_(StockTransfer.from_pharmacy_id.in_(owned), StockTransfer.to_pharmacy_id.in_(owned)))
    return [transfer_data(row, user) for row in db.scalars(query)]


class TransferCreate(BaseModel):
    from_inventory_id: int = Field(gt=0, le=MAX_STOCK, strict=True)
    to_inventory_id: int = Field(gt=0, le=MAX_STOCK, strict=True)
    quantity: int = Field(gt=0, le=MAX_STOCK, strict=True)
    request_key: UUID


@router.post("/transfers")
def record_transfer(payload: TransferCreate, user: User = Depends(supplier), db: Session = Depends(get_db)):
    expire_reservations(db)
    ids = sorted({payload.from_inventory_id, payload.to_inventory_id})
    rows = {row.id: row for row in db.scalars(select(Inventory).where(Inventory.id.in_(ids))
        .order_by(Inventory.id).with_for_update())}
    source, destination = rows.get(payload.from_inventory_id), rows.get(payload.to_inventory_id)
    if not source or not destination or not eligible_for_user(source, destination, user):
        raise HTTPException(404, "Transfer stock not found")
    if user.role != UserRole.ADMIN and source.pharmacy.owner_user_id != user.id:
        raise HTTPException(403, "Only the supplying institution can record a transfer")
    existing = db.scalar(select(StockTransfer).where(StockTransfer.request_key == str(payload.request_key)))
    if existing:
        if (existing.from_pharmacy_id, existing.to_pharmacy_id, existing.medicine_id, existing.quantity) != (
                source.pharmacy_id, destination.pharmacy_id, source.medicine_id, payload.quantity):
            raise HTTPException(409, "Transfer request key already used")
        return transfer_data(existing, user)
    eligible_ids = {row.id for row in eligible_stock(db)}
    if source.id == destination.id or source.pharmacy_id == destination.pharmacy_id or source.medicine_id != destination.medicine_id:
        raise HTTPException(422, "Transfer must use the same medicine at different institutions")
    if source.id not in eligible_ids or destination.id not in eligible_ids:
        raise HTTPException(409, "Both transfer institutions must be approved and open")
    surplus = source.current_stock - source.reserved_stock - target(source)
    needed = target(destination) - (destination.current_stock - destination.reserved_stock)
    if payload.quantity > min(surplus, needed):
        raise HTTPException(409, "Stock changed; refresh transfer suggestions")
    source.current_stock -= payload.quantity
    destination.current_stock += payload.quantity
    row = StockTransfer(from_pharmacy_id=source.pharmacy_id, to_pharmacy_id=destination.pharmacy_id,
        medicine_id=source.medicine_id, quantity=payload.quantity, request_key=str(payload.request_key),
        recommendation_reason="Recorded completed stock transfer", status=StockTransferStatus.COMPLETED)
    db.add(row)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Transfer request key already used") from None
    for user_id in {source.pharmacy.owner_user_id, destination.pharmacy.owner_user_id} - {None}:
        queue_email(db, user_id, f"transfer:{row.id}:{user_id}", "MediAssure: stock transfer recorded",
            f"Transfer #{row.id}\n{source.pharmacy.name} -> {destination.pharmacy.name}\n"
            f"Medicine: {source.medicine.name} {source.medicine.strength or ''}\nQuantity: {payload.quantity}")
    audit(db, user, "Completed stock transfer", f"#{row.id}: {source.pharmacy.name} -> {destination.pharmacy.name}")
    db.commit()
    return transfer_data(row, user)


@router.get("/verified-alternatives", dependencies=[Depends(approved_user)])
def alternatives():
    return []


@router.get("/alerts")
def alerts(user: User = Depends(require_roles(UserRole.PHARMACIST, UserRole.HOSPITAL_STAFF, UserRole.ADMIN)), db: Session = Depends(get_db)):
    expire_reservations(db)
    result = []
    for item in db.scalars(inventory_query(user)):
        if item.current_stock - item.reserved_stock <= item.reorder_level:
            result.append({"title": " ".join(filter(None, [item.medicine.name, item.medicine.strength])),
                "detail": f"{item.pharmacy.name}: {item.current_stock-item.reserved_stock} available units",
                "inventory_id": item.id, "available": item.current_stock-item.reserved_stock,
                "reserved": item.reserved_stock, "reorder_level": item.reorder_level,
                "pharmacy": item.pharmacy.name, "tone": "danger" if item.current_stock == item.reserved_stock else "amber"})
    db.commit()
    return result


@router.post("/alerts/email")
def email_alerts(user: User = Depends(supplier), db: Session = Depends(get_db)):
    expire_reservations(db)
    # Only email the signed-in supplier's own stock, even for Admin.
    from app.models.pharmacy import Pharmacy
    items = db.scalars(select(Inventory).join(Pharmacy).where(Pharmacy.owner_user_id == user.id)).all()
    today = datetime.now(UTC).date().isoformat()
    queued = 0
    for item in items:
        if item.current_stock - item.reserved_stock <= item.reorder_level:
            queued += int(queue_email(db, user.id, f"low-stock:{item.id}:{today}", f"MediAssure: low stock - {item.medicine.name}",
                        f"{item.pharmacy.name}: {item.current_stock-item.reserved_stock} available units"))
    db.commit()
    return {"transport": get_settings().email_transport, "queued": queued}


@router.get("/emails")
def email_status(user: User = Depends(approved_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(EmailMessage).where(EmailMessage.user_id == user.id)
        .order_by(EmailMessage.id.desc()).limit(50))
    return {"transport": get_settings().email_transport, "messages": [
        {"id": row.id, "subject": row.subject, "status": row.status, "attempts": row.attempts,
         "last_error": row.last_error, "created_at": row.created_at.isoformat(),
         "sent_at": row.sent_at.isoformat() if row.sent_at else None} for row in rows]}


@router.post("/emails/{message_id}/retry")
def retry_email(message_id: int, user: User = Depends(approved_user), db: Session = Depends(get_db)):
    row = db.scalar(select(EmailMessage).where(EmailMessage.id == message_id,
        EmailMessage.user_id == user.id).with_for_update())
    if row is None:
        raise HTTPException(404, "Email notification not found")
    if row.status != "failed":
        raise HTTPException(409, "Only failed emails can be retried")
    row.status, row.attempts, row.last_error = "pending", 0, None
    row.next_attempt_at = datetime.now(UTC)
    db.commit()
    return {"status": row.status}


@router.get("/audit-events")
def audit_events(user: User = Depends(approved_user), db: Session = Depends(get_db)):
    query = select(AuditRecord).order_by(AuditRecord.id.desc()).limit(100)
    if user.role != UserRole.ADMIN:
        query = query.where(AuditRecord.actor_id == user.id)
    return [{"actor": db.get(User, row.actor_id).name, "action": row.action, "target": row.target,
             "time": row.created_at.isoformat(), "tone": "teal"} for row in db.scalars(query)]
