import type { InventoryItem, OperationalAlert, PharmacyMatch, Reservation, TransferSuggestion } from "../types";

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
