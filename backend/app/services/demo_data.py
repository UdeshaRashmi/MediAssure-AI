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


INVENTORY = [
    InventoryItem(
        medicine="Salbutamol Inhaler",
        generic="Salbutamol",
        category="Respiratory",
        stock=10,
        reserved=2,
        reorder_level=12,
        predicted_24h=14,
        status="Low",
        risk="High",
        updated="5 min ago",
    ),
    InventoryItem(
        medicine="Insulin Rapid Acting",
        generic="Insulin Aspart",
        category="Diabetes",
        stock=4,
        reserved=1,
        reorder_level=6,
        predicted_24h=7,
        status="Watch",
        risk="Medium",
        updated="12 min ago",
    ),
    InventoryItem(
        medicine="Paracetamol 500 mg",
        generic="Acetaminophen",
        category="Analgesic",
        stock=48,
        reserved=4,
        reorder_level=18,
        predicted_24h=22,
        status="Healthy",
        risk="Low",
        updated="2 min ago",
    ),
    InventoryItem(
        medicine="Amoxicillin 500 mg",
        generic="Amoxicillin",
        category="Antibiotic",
        stock=16,
        reserved=3,
        reorder_level=15,
        predicted_24h=18,
        status="Watch",
        risk="Medium",
        updated="28 min ago",
    ),
]

RECOMMENDATIONS = [
    PharmacyRecommendation(
        id=2,
        name="City Care Pharmacy",
        area="Colombo 07",
        distance_km=2.5,
        travel_time_minutes=9,
        contact_number="+94 11 245 9088",
        current_stock=10,
        availability_confidence=0.95,
        emergency_rescue_score=91.0,
        is_open=True,
        verified=True,
    ),
    PharmacyRecommendation(
        id=1,
        name="Nearest Meds",
        area="Borella",
        distance_km=1.0,
        travel_time_minutes=5,
        contact_number="+94 11 269 4411",
        current_stock=1,
        availability_confidence=0.30,
        emergency_rescue_score=42.0,
        is_open=True,
        verified=True,
    ),
]

RESERVATIONS = [
    ReservationItem(id="R-1024", patient="Emergency user", medicine="Salbutamol Inhaler", quantity=1, eta="9 min", status="Awaiting pickup"),
    ReservationItem(id="R-1025", patient="Hospital staff", medicine="Insulin Rapid Acting", quantity=2, eta="18 min", status="Pharmacist confirmed"),
    ReservationItem(id="R-1026", patient="Walk-in request", medicine="Paracetamol 500 mg", quantity=2, eta="In store", status="Ready"),
]

TRANSFERS = [
    TransferSuggestion(
        source_pharmacy="WellCare Pharmacy",
        target_pharmacy="City Care Pharmacy",
        medicine="Salbutamol Inhaler",
        quantity=8,
        distance="1.7 km",
        impact="+31% availability",
    ),
    TransferSuggestion(
        source_pharmacy="Central Meds",
        target_pharmacy="Union Med House",
        medicine="Insulin Rapid Acting",
        quantity=4,
        distance="2.1 km",
        impact="+18% availability",
    ),
]

FORECASTS = [
    ForecastItem(
        medicine="Salbutamol Inhaler",
        next_24h=14,
        next_72h=41,
        stockout_risk=86,
        trend="Rising",
        driver="Evening respiratory demand and nearby clinic referrals",
    ),
    ForecastItem(
        medicine="Insulin Rapid Acting",
        next_24h=7,
        next_72h=19,
        stockout_risk=68,
        trend="Rising",
        driver="Low buffer after emergency reservations",
    ),
    ForecastItem(
        medicine="Amoxicillin 500 mg",
        next_24h=18,
        next_72h=34,
        stockout_risk=54,
        trend="Stable",
        driver="Seasonal antibiotic demand near reorder level",
    ),
]

NETWORK = [
    NetworkPharmacy(
        name="City Care Pharmacy",
        area="Colombo 07",
        status="Online",
        open_until="10:30 PM",
        stock_health=78,
        urgent_gaps=2,
        last_sync="2 min ago",
        latitude=6.9147,
        longitude=79.8666,
    ),
    NetworkPharmacy(
        name="WellCare Pharmacy",
        area="Borella",
        status="Online",
        open_until="11:00 PM",
        stock_health=84,
        urgent_gaps=1,
        last_sync="4 min ago",
        latitude=6.914,
        longitude=79.877,
    ),
    NetworkPharmacy(
        name="Union Med House",
        area="Narahenpita",
        status="Delayed",
        open_until="9:00 PM",
        stock_health=62,
        urgent_gaps=3,
        last_sync="31 min ago",
        latitude=6.8905,
        longitude=79.8772,
    ),
]

ALERTS = [
    OperationalAlert(title="Salbutamol stock-out risk", detail="Predicted shortage within 24h if 8 units are not transferred.", tone="danger"),
    OperationalAlert(title="Reservation waiting", detail="One emergency reservation needs pharmacist confirmation.", tone="amber"),
    OperationalAlert(title="Inventory sync healthy", detail="Last pharmacy sync completed 2 minutes ago.", tone="good"),
]

AUDIT_EVENTS = [
    AuditEvent(
        actor="City Care Operator",
        action="Confirmed emergency reservation",
        target="R-1024 - Salbutamol Inhaler",
        time="3 min ago",
        tone="teal",
    ),
    AuditEvent(
        actor="AI stock guard",
        action="Raised transfer recommendation",
        target="WellCare to City Care",
        time="11 min ago",
        tone="amber",
    ),
    AuditEvent(
        actor="Union Med House",
        action="Delayed inventory sync",
        target="Critical medicines feed",
        time="31 min ago",
        tone="danger",
    ),
]

VERIFIED_ALTERNATIVES = [
    VerifiedAlternative(
        requested="Paracetamol 500 mg",
        alternative="Acetaminophen 500 mg",
        type="Generic equivalent",
        verifier="Pharmacist verified",
        status="Display allowed",
    ),
    VerifiedAlternative(
        requested="Salbutamol Inhaler",
        alternative="Ventolin inhaler brand match",
        type="Generic equivalent",
        verifier="Pharmacist verified",
        status="Display allowed",
    ),
    VerifiedAlternative(
        requested="Amoxicillin 500 mg",
        alternative="Amoxicillin-clavulanate",
        type="Same class review",
        verifier="Doctor review required",
        status="Pharmacist review",
    ),
]
