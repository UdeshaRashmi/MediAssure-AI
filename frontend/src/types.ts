export type Page = "finder" | "dashboard" | "inventory" | "reservations" | "rebalancing" | "alerts";
export type Risk = "Low" | "Medium" | "High";
export type StockStatus = "Healthy" | "Watch" | "Low";
export type BadgeTone = "teal" | "danger" | "amber";

export type InventoryItem = {
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

export type PharmacyMatch = {
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
