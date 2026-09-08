import type {
  DemandForecast,
  InventoryItem,
  NetworkPharmacy,
  OperationalAlert,
  PharmacyMatch,
  Reservation,
  TransferSuggestion,
  VerifiedAlternative,
} from "../types";

export const inventory: InventoryItem[] = [
  {
    medicine: "Salbutamol Inhaler",
    generic: "Salbutamol",
    category: "Respiratory",
    stock: 10,
    reserved: 2,
    reorderLevel: 12,
    predicted24h: 14,
    status: "Low",
    risk: "High",
    updated: "5 min ago",
  },
  {
    medicine: "Insulin Rapid Acting",
    generic: "Insulin Aspart",
    category: "Diabetes",
    stock: 4,
    reserved: 1,
    reorderLevel: 6,
    predicted24h: 7,
    status: "Watch",
    risk: "Medium",
    updated: "12 min ago",
  },
  {
    medicine: "Paracetamol 500 mg",
    generic: "Acetaminophen",
    category: "Analgesic",
    stock: 48,
    reserved: 4,
    reorderLevel: 18,
    predicted24h: 22,
    status: "Healthy",
    risk: "Low",
    updated: "2 min ago",
  },
  {
    medicine: "Amoxicillin 500 mg",
    generic: "Amoxicillin",
    category: "Antibiotic",
    stock: 16,
    reserved: 3,
    reorderLevel: 15,
    predicted24h: 18,
    status: "Watch",
    risk: "Medium",
    updated: "28 min ago",
  },
];

export const pharmacyMatches: PharmacyMatch[] = [
  {
    name: "City Care Pharmacy",
    area: "Colombo 07",
    distance: "1.2 km",
    eta: "9 min",
    phone: "+94 11 245 9088",
    medicine: "Salbutamol Inhaler",
    stock: 10,
    confidence: 95,
    rescueScore: 92,
    verified: true,
  },
  {
    name: "WellCare Pharmacy",
    area: "Borella",
    distance: "1.7 km",
    eta: "13 min",
    phone: "+94 11 269 4411",
    medicine: "Salbutamol Inhaler",
    stock: 8,
    confidence: 88,
    rescueScore: 84,
    verified: true,
  },
  {
    name: "Union Med House",
    area: "Narahenpita",
    distance: "2.5 km",
    eta: "18 min",
    phone: "+94 11 533 2700",
    medicine: "Insulin Rapid Acting",
    stock: 4,
    confidence: 76,
    rescueScore: 79,
    verified: true,
  },
];

export const reservations: Reservation[] = [
  { id: "R-1024", patient: "Emergency user", medicine: "Salbutamol Inhaler", qty: 1, eta: "9 min", status: "Awaiting pickup" },
  { id: "R-1025", patient: "Hospital staff", medicine: "Insulin Rapid Acting", qty: 2, eta: "18 min", status: "Pharmacist confirmed" },
  { id: "R-1026", patient: "Walk-in request", medicine: "Paracetamol 500 mg", qty: 2, eta: "In store", status: "Ready" },
];

export const transfers: TransferSuggestion[] = [
  { from: "WellCare Pharmacy", to: "City Care Pharmacy", medicine: "Salbutamol Inhaler", qty: 8, distance: "1.7 km", impact: "+31% availability" },
  { from: "Central Meds", to: "Union Med House", medicine: "Insulin Rapid Acting", qty: 4, distance: "2.1 km", impact: "+18% availability" },
];

export const alerts: OperationalAlert[] = [
  { title: "Salbutamol stock-out risk", detail: "Predicted shortage within 24h if 8 units are not transferred.", tone: "danger" },
  { title: "Reservation waiting", detail: "One emergency reservation needs pharmacist confirmation.", tone: "amber" },
  { title: "Inventory sync healthy", detail: "Last pharmacy sync completed 2 minutes ago.", tone: "good" },
];

export const forecasts: DemandForecast[] = [
  {
    medicine: "Salbutamol Inhaler",
    next24h: 14,
    next72h: 41,
    stockoutRisk: 86,
    trend: "Rising",
    driver: "Evening respiratory demand and nearby clinic referrals",
  },
  {
    medicine: "Insulin Rapid Acting",
    next24h: 7,
    next72h: 19,
    stockoutRisk: 68,
    trend: "Rising",
    driver: "Low buffer after emergency reservations",
  },
  {
    medicine: "Amoxicillin 500 mg",
    next24h: 18,
    next72h: 34,
    stockoutRisk: 54,
    trend: "Stable",
    driver: "Seasonal antibiotic demand near reorder level",
  },
  {
    medicine: "Paracetamol 500 mg",
    next24h: 22,
    next72h: 49,
    stockoutRisk: 21,
    trend: "Falling",
    driver: "Healthy stock coverage across partner pharmacies",
  },
];

export const networkPharmacies: NetworkPharmacy[] = [
  {
    name: "City Care Pharmacy",
    area: "Colombo 07",
    status: "Online",
    openUntil: "10:30 PM",
    stockHealth: 78,
    urgentGaps: 2,
    lastSync: "2 min ago",
  },
  {
    name: "WellCare Pharmacy",
    area: "Borella",
    status: "Online",
    openUntil: "11:00 PM",
    stockHealth: 84,
    urgentGaps: 1,
    lastSync: "4 min ago",
  },
  {
    name: "Union Med House",
    area: "Narahenpita",
    status: "Delayed",
    openUntil: "9:00 PM",
    stockHealth: 62,
    urgentGaps: 3,
    lastSync: "31 min ago",
  },
  {
    name: "Central Meds",
    area: "Town Hall",
    status: "Online",
    openUntil: "12:00 AM",
    stockHealth: 91,
    urgentGaps: 0,
    lastSync: "7 min ago",
  },
];

export const verifiedAlternatives: VerifiedAlternative[] = [
  {
    requested: "Paracetamol 500 mg",
    alternative: "Acetaminophen 500 mg",
    type: "Generic equivalent",
    verifier: "Pharmacist verified",
    status: "Display allowed",
  },
  {
    requested: "Salbutamol Inhaler",
    alternative: "Ventolin inhaler brand match",
    type: "Generic equivalent",
    verifier: "Pharmacist verified",
    status: "Display allowed",
  },
  {
    requested: "Amoxicillin 500 mg",
    alternative: "Amoxicillin-clavulanate",
    type: "Same class review",
    verifier: "Doctor review required",
    status: "Pharmacist review",
  },
];
