import type {
  AuditEvent,
  DemandForecast,
  InventoryItem,
  NetworkPharmacy,
  OperationalAlert,
  PharmacyMatch,
  Reservation,
  SessionUser,
  TransferSuggestion,
  VerifiedAlternative,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type MedicineSearchResult = {
  id: number;
  name: string;
  generic_name: string;
  category: string;
  strength: string;
  requires_prescription: boolean;
  criticality_level: string;
};

type PharmacyRecommendation = {
  id: number;
  name: string;
  area: string;
  distance_km: number;
  travel_time_minutes: number;
  contact_number: string;
  current_stock: number;
  availability_confidence: number;
  emergency_rescue_score: number;
  is_open: boolean;
  verified: boolean;
};

export type ApiStatus = "checking" | "online" | "offline";

type LoginResponse = {
  access_token: string;
  expires_at: string;
  user: SessionUser;
};

export type DashboardSummary = {
  activeMedicines: number;
  lowStockRisk: number;
  pendingReservations: number;
  transferSuggestions: number;
  apiMode: string;
};

type ApiInventoryItem = {
  medicine: string;
  generic: string;
  category: string;
  stock: number;
  reserved: number;
  reorder_level: number;
  predicted_24h: number;
  status: InventoryItem["status"];
  risk: InventoryItem["risk"];
  updated: string;
};

type ApiReservation = {
  id: string;
  patient: string;
  medicine: string;
  quantity: number;
  eta: string;
  status: string;
};

type ApiTransferSuggestion = {
  source_pharmacy: string;
  target_pharmacy: string;
  medicine: string;
  quantity: number;
  distance: string;
  impact: string;
};

type ApiForecast = {
  medicine: string;
  next_24h: number;
  next_72h: number;
  stockout_risk: number;
  trend: DemandForecast["trend"];
  driver: string;
};

type ApiNetworkPharmacy = {
  name: string;
  area: string;
  status: NetworkPharmacy["status"];
  open_until: string;
  stock_health: number;
  urgent_gaps: number;
  last_sync: string;
  latitude: number;
  longitude: number;
};

type ApiDashboardSummary = {
  active_medicines: number;
  low_stock_risk: number;
  pending_reservations: number;
  transfer_suggestions: number;
  api_mode: string;
};

export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(2500) });
    return response.ok;
  } catch {
    return false;
  }
}

export async function fetchPharmacyRecommendations(query: string): Promise<PharmacyMatch[]> {
  const medicines = await getJson<MedicineSearchResult[]>(
    `/medicines/search?query=${encodeURIComponent(query || "Salbutamol")}`,
  );
  const selectedMedicine = medicines[0];

  if (!selectedMedicine) {
    return [];
  }

  const recommendations = await getJson<PharmacyRecommendation[]>(
    `/pharmacies/recommendations?medicine_id=${selectedMedicine.id}&latitude=6.9271&longitude=79.8612&quantity=1`,
  );

  return recommendations.map((item) => ({
    name: item.name,
    area: item.area,
    distance: `${item.distance_km.toFixed(1)} km`,
    eta: `${item.travel_time_minutes} min`,
    phone: item.contact_number,
    medicine: `${selectedMedicine.name} ${selectedMedicine.strength}`,
    stock: item.current_stock,
    confidence: Math.round(item.availability_confidence * 100),
    rescueScore: Math.round(item.emergency_rescue_score),
    verified: item.verified && item.is_open,
  }));
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const summary = await getJson<ApiDashboardSummary>("/dashboard/summary");

  return {
    activeMedicines: summary.active_medicines,
    lowStockRisk: summary.low_stock_risk,
    pendingReservations: summary.pending_reservations,
    transferSuggestions: summary.transfer_suggestions,
    apiMode: summary.api_mode,
  };
}

export async function fetchInventory(): Promise<InventoryItem[]> {
  const items = await getJson<ApiInventoryItem[]>("/inventory");

  return items.map((item) => ({
    medicine: item.medicine,
    generic: item.generic,
    category: item.category,
    stock: item.stock,
    reserved: item.reserved,
    reorderLevel: item.reorder_level,
    predicted24h: item.predicted_24h,
    status: item.status,
    risk: item.risk,
    updated: item.updated,
  }));
}

export async function fetchReservations(): Promise<Reservation[]> {
  const items = await getJson<ApiReservation[]>("/reservations");

  return items.map((item) => ({
    id: item.id,
    patient: item.patient,
    medicine: item.medicine,
    qty: item.quantity,
    eta: item.eta,
    status: item.status,
  }));
}

export async function fetchTransfers(): Promise<TransferSuggestion[]> {
  const items = await getJson<ApiTransferSuggestion[]>("/operations/transfers");

  return items.map((item) => ({
    from: item.source_pharmacy,
    to: item.target_pharmacy,
    medicine: item.medicine,
    qty: item.quantity,
    distance: item.distance,
    impact: item.impact,
  }));
}

export async function fetchForecasts(): Promise<DemandForecast[]> {
  const items = await getJson<ApiForecast[]>("/operations/forecasts");

  return items.map((item) => ({
    medicine: item.medicine,
    next24h: item.next_24h,
    next72h: item.next_72h,
    stockoutRisk: item.stockout_risk,
    trend: item.trend,
    driver: item.driver,
  }));
}

export async function fetchNetworkPharmacies(): Promise<NetworkPharmacy[]> {
  const items = await getJson<ApiNetworkPharmacy[]>("/pharmacies");

  return items.map((item) => ({
    name: item.name,
    area: item.area,
    status: item.status,
    openUntil: item.open_until,
    stockHealth: item.stock_health,
    urgentGaps: item.urgent_gaps,
    lastSync: item.last_sync,
    latitude: item.latitude,
    longitude: item.longitude,
  }));
}

export async function fetchAlerts(): Promise<OperationalAlert[]> {
  return getJson<OperationalAlert[]>("/operations/alerts");
}

export async function fetchVerifiedAlternatives(): Promise<VerifiedAlternative[]> {
  return getJson<VerifiedAlternative[]>("/operations/verified-alternatives");
}

export async function fetchAuditEvents(): Promise<AuditEvent[]> {
  return getJson<AuditEvent[]>("/operations/audit-events");
}

export async function loginWithApi(email: string, password: string, role: SessionUser["role"]): Promise<SessionUser> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    body: JSON.stringify({ email, password, role }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
    signal: AbortSignal.timeout(3500),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const payload = (await response.json()) as LoginResponse;
  window.localStorage.setItem("mediassure-token", payload.access_token);
  window.localStorage.setItem("mediassure-token-expires-at", payload.expires_at);
  return payload.user;
}

export async function signupWithApi({
  email,
  name,
  password,
  phone,
  role,
}: {
  email: string;
  name: string;
  password: string;
  phone?: string;
  role: SessionUser["role"];
}): Promise<SessionUser> {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    body: JSON.stringify({ email, name, password, phone, role }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
    signal: AbortSignal.timeout(3500),
  });

  if (!response.ok) {
    throw new Error(`Signup failed: ${response.status}`);
  }

  const payload = (await response.json()) as LoginResponse;
  window.localStorage.setItem("mediassure-token", payload.access_token);
  window.localStorage.setItem("mediassure-token-expires-at", payload.expires_at);
  return payload.user;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal: AbortSignal.timeout(3500) });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
