from pydantic import BaseModel, Field


class MedicineSearchResult(BaseModel):
    id: int
    name: str
    generic_name: str
    category: str
    strength: str
    requires_prescription: bool
    criticality_level: str


class PharmacyRecommendation(BaseModel):
    id: int
    name: str
    area: str
    distance_km: float
    travel_time_minutes: int
    contact_number: str
    current_stock: int
    availability_confidence: float = Field(ge=0, le=1)
    emergency_rescue_score: float = Field(ge=0, le=100)
    is_open: bool
    verified: bool


class InventoryItem(BaseModel):
    medicine: str
    generic: str
    category: str
    stock: int
    reserved: int
    reorder_level: int
    predicted_24h: int
    status: str
    risk: str
    updated: str


class ReservationItem(BaseModel):
    id: str
    patient: str
    medicine: str
    quantity: int
    eta: str
    status: str


class ReservationCreate(BaseModel):
    patient: str = "Emergency user"
    medicine: str
    quantity: int = Field(default=1, gt=0)
    pharmacy_name: str


class TransferSuggestion(BaseModel):
    source_pharmacy: str
    target_pharmacy: str
    medicine: str
    quantity: int
    distance: str
    impact: str


class ForecastItem(BaseModel):
    medicine: str
    next_24h: int
    next_72h: int
    stockout_risk: int = Field(ge=0, le=100)
    trend: str
    driver: str


class NetworkPharmacy(BaseModel):
    name: str
    area: str
    status: str
    open_until: str
    stock_health: int = Field(ge=0, le=100)
    urgent_gaps: int
    last_sync: str
    latitude: float
    longitude: float


class OperationalAlert(BaseModel):
    title: str
    detail: str
    tone: str


class VerifiedAlternative(BaseModel):
    requested: str
    alternative: str
    type: str
    verifier: str
    status: str


class AuditEvent(BaseModel):
    actor: str
    action: str
    target: str
    time: str
    tone: str


class DashboardSummary(BaseModel):
    active_medicines: int
    low_stock_risk: int
    pending_reservations: int
    transfer_suggestions: int
    api_mode: str = "demo"
