import type { PharmacyMatch, SessionUser } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type MedicineSearchResult = {
  id: number;
  name: string;
  generic_name: string;
  strength: string;
  requires_prescription: boolean;
  criticality_level: string;
};

type PharmacyRecommendation = {
  id: number;
  name: string;
  distance_km: number;
  travel_time_minutes: number;
  current_stock: number;
  availability_confidence: number;
  emergency_rescue_score: number;
  is_open: boolean;
};

export type ApiStatus = "checking" | "online" | "offline";

type LoginResponse = {
  access_token: string;
  expires_at: string;
  user: SessionUser;
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
    area: item.name === "City Care Pharmacy" ? "Colombo 07" : "Nearby network",
    distance: `${item.distance_km.toFixed(1)} km`,
    eta: `${item.travel_time_minutes} min`,
    phone: "+94 11 245 9088",
    medicine: `${selectedMedicine.name} ${selectedMedicine.strength}`,
    stock: item.current_stock,
    confidence: Math.round(item.availability_confidence * 100),
    rescueScore: Math.round(item.emergency_rescue_score),
    verified: item.is_open,
  }));
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
