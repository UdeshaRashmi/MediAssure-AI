from fastapi import APIRouter

from app.schemas.demo import DashboardSummary
from app.services.demo_data import INVENTORY, RESERVATIONS, TRANSFERS


router = APIRouter()


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary() -> DashboardSummary:
    return DashboardSummary(
        active_medicines=128,
        low_stock_risk=sum(1 for item in INVENTORY if item.status in {"Low", "Watch"}),
        pending_reservations=sum(1 for item in RESERVATIONS if item.status != "Ready"),
        transfer_suggestions=len(TRANSFERS),
    )
