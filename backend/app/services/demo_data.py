from app.schemas.demo import (
    AuditEvent,
    ForecastItem,
    InventoryItem,
    NetworkPharmacy,
    OperationalAlert,
    PharmacyRecommendation,
    ReservationItem,
    TransferSuggestion,
    VerifiedAlternative,
)


# In-memory prototype stores. These start empty so the UI only shows data that
# was created through backend actions during the current server run.
USERS: dict[str, dict[str, str]] = {}
INVENTORY: list[InventoryItem] = []
RECOMMENDATIONS: list[PharmacyRecommendation] = []
RESERVATIONS: list[ReservationItem] = []
TRANSFERS: list[TransferSuggestion] = []
FORECASTS: list[ForecastItem] = []
NETWORK: list[NetworkPharmacy] = []
ALERTS: list[OperationalAlert] = []
AUDIT_EVENTS: list[AuditEvent] = []
VERIFIED_ALTERNATIVES: list[VerifiedAlternative] = []
