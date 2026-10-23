export type Page =
  | "finder"
  | "request"
  | "dashboard"
  | "inventory"
  | "forecast"
  | "reservations"
  | "rebalancing"
  | "network"
  | "alerts"
  | "settings";
export type Risk = "Low" | "Medium" | "High";
export type StockStatus = "Healthy" | "Watch" | "Low";
export type BadgeTone = "teal" | "danger" | "amber";

export type InventoryItem = {
  id: number;
  pharmacyName: string;
  medicine: string;
  generic: string;
  category: string;
  stock: number;
  reserved: number;
  reorderLevel: number;
  predicted24h: number;
  status: StockStatus;
  risk: Risk;
  updated: string;
};

export type MedicineLocation = {
  id: number;
  name: string;
  location_type: "Pharmacy" | "Hospital";
  area: string;
  contact_number: string;
  latitude: number | null;
  longitude: number | null;
  is_open: boolean;
  opening_hours: string;
};

export type PharmacyMatch = {
  locationType: "Pharmacy" | "Hospital";
  latitude: number;
  longitude: number;
  updatedAt: string;
  inventoryId: number;
  name: string;
  area: string;
  distance: string;
  eta: string;
  phone: string;
  medicine: string;
  stock: number;
  confidence: number;
  rescueScore: number;
  verified: boolean;
};

export type Reservation = {
  canManage: boolean;
  pharmacyName: string;
  id: string;
  patient: string;
  medicine: string;
  qty: number;
  eta: string;
  status: string;
};

export type TransferSuggestion = {
  from: string;
  to: string;
  medicine: string;
  qty: number;
  distance: string;
  impact: string;
};

export type OperationalAlert = {
  title: string;
  detail: string;
  tone: "danger" | "amber" | "good";
};

export type DemandForecast = {
  medicine: string;
  next24h: number;
  next72h: number;
  stockoutRisk: number;
  trend: "Rising" | "Stable" | "Falling";
  driver: string;
};

export type NetworkPharmacy = {
  locationType: "Pharmacy" | "Hospital";
  name: string;
  area: string;
  status: "Online" | "Delayed" | "Offline";
  openUntil: string;
  stockHealth: number;
  urgentGaps: number;
  lastSync: string;
  latitude: number;
  longitude: number;
};

export type VerifiedAlternative = {
  requested: string;
  alternative: string;
  type: "Generic equivalent" | "Same class review" | "Strength check";
  verifier: string;
  status: "Display allowed" | "Pharmacist review";
};

export type SessionUser = {
  id: number;
  approved: boolean;
  name: string;
  email: string;
  role: "Patient" | "Pharmacist" | "Hospital Staff" | "Admin";
};

export type AuditEvent = {
  actor: string;
  action: string;
  target: string;
  time: string;
  tone: "teal" | "amber" | "danger";
};
