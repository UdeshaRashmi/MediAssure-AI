from fastapi import APIRouter

from app.schemas.demo import AuditEvent, ForecastItem, OperationalAlert, TransferSuggestion, VerifiedAlternative
from app.services.demo_data import ALERTS, AUDIT_EVENTS, FORECASTS, TRANSFERS, VERIFIED_ALTERNATIVES


router = APIRouter()


@router.get("/forecasts", response_model=list[ForecastItem])
def list_forecasts() -> list[ForecastItem]:
    return FORECASTS


@router.get("/transfers", response_model=list[TransferSuggestion])
def list_transfer_suggestions() -> list[TransferSuggestion]:
    return TRANSFERS


@router.get("/alerts", response_model=list[OperationalAlert])
def list_alerts() -> list[OperationalAlert]:
    return ALERTS


@router.get("/verified-alternatives", response_model=list[VerifiedAlternative])
def list_verified_alternatives() -> list[VerifiedAlternative]:
    return VERIFIED_ALTERNATIVES


@router.get("/audit-events", response_model=list[AuditEvent])
def list_audit_events() -> list[AuditEvent]:
    return AUDIT_EVENTS
