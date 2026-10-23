from sqlalchemy import select
from app.models.inventory import Inventory
from app.models.pharmacy import Pharmacy
from app.models.user import User, UserRole
from app.services.records import distance_km


def eligible_stock(db):
    return db.scalars(select(Inventory).join(Pharmacy).join(User, Pharmacy.owner_user_id == User.id)
        .where(Pharmacy.is_open.is_(True), User.is_approved.is_(True),
               User.role.in_([UserRole.PHARMACIST, UserRole.HOSPITAL_STAFF, UserRole.ADMIN]))
        .order_by(Inventory.id)).all()


def target(item):
    return max(1, item.reorder_level * 2)


def eligible_for_user(source, destination, user):
    return user.role == UserRole.ADMIN or user.id in (source.pharmacy.owner_user_id, destination.pharmacy.owner_user_id)


def suggestions(db, user):
    items = eligible_stock(db)
    available = {item.id: item.current_stock - item.reserved_stock for item in items}
    result = []
    for destination in items:
        if available[destination.id] > destination.reorder_level:
            continue
        donors = []
        for source in items:
            if source.pharmacy_id == destination.pharmacy_id or source.medicine_id != destination.medicine_id:
                continue
            if not eligible_for_user(source, destination, user):
                continue
            if available[source.id] <= target(source):
                continue
            coords = (source.pharmacy.latitude, source.pharmacy.longitude,
                      destination.pharmacy.latitude, destination.pharmacy.longitude)
            distance = distance_km(*coords) if all(value is not None for value in coords) else None
            donors.append((distance, source))
        for distance, source in sorted(donors, key=lambda row: (row[0] if row[0] is not None else float("inf"), row[1].id)):
            quantity = min(available[source.id] - target(source), target(destination) - available[destination.id])
            if quantity <= 0:
                continue
            available[source.id] -= quantity
            available[destination.id] += quantity
            result.append({"from_inventory_id": source.id, "to_inventory_id": destination.id,
                "from": source.pharmacy.name, "to": destination.pharmacy.name,
                "medicine": " ".join(filter(None, [source.medicine.name, source.medicine.strength])),
                "qty": quantity, "distance_km": round(distance, 1) if distance is not None else None,
                "can_execute": user.role == UserRole.ADMIN or source.pharmacy.owner_user_id == user.id})
    return result


def transfer_data(row, user):
    return {"id": row.id, "from": row.from_pharmacy.name, "to": row.to_pharmacy.name,
            "medicine": " ".join(filter(None, [row.medicine.name, row.medicine.strength])),
            "qty": row.quantity, "status": row.status.value, "created_at": row.created_at.isoformat()}
