from app.schemas.demo import NetworkPharmacy
from app.services.demo_data import INVENTORY, NETWORK


def refresh_pharmacy(pharmacy_name: str) -> None:
    """Recompute a pharmacy summary while the caller holds STORE_LOCK."""
    items = [item for item in INVENTORY if item.pharmacy_name.casefold() == pharmacy_name.casefold()]
    if not items:
        return
    source = items[-1]
    health = round(sum(min(100, (item.stock - item.reserved) / max(item.reorder_level * 2, 1) * 100)
                       for item in items) / len(items))
    gaps = sum(max(0, item.reorder_level - (item.stock - item.reserved)) for item in items)
    NETWORK[:] = [pharmacy for pharmacy in NETWORK if pharmacy.name.casefold() != pharmacy_name.casefold()]
    NETWORK.append(NetworkPharmacy(
        name=source.pharmacy_name, area=source.area, status="Online", open_until="Not provided",
        stock_health=health, urgent_gaps=gaps, last_sync="just now",
        latitude=source.latitude, longitude=source.longitude,
    ))
