import type { AuditEvent, DemandForecast, InventoryItem, MedicineLocation, NetworkPharmacy, OperationalAlert, PharmacyMatch, Reservation, SessionUser, TransferSuggestion, VerifiedAlternative } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8001";
export type ApiStatus = "checking" | "online" | "offline";
export type DashboardSummary = { activeMedicines: number; lowStockRisk: number; pendingReservations: number; transferSuggestions: number; apiMode: string };

export async function request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const token = localStorage.getItem("mediassure-token");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method, signal: AbortSignal.timeout(15000),
    headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401 && !path.startsWith("/auth/login")) window.dispatchEvent(new Event("mediassure-session-expired"));
    throw new Error(typeof payload.detail === "string" ? payload.detail : Array.isArray(payload.detail) ? "Check the form fields and try again." : "Request failed. Please try again.");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function checkApiHealth() { try { await request("/health"); return true; } catch { return false; } }
export function fetchCurrentUser() { return request<SessionUser>("/auth/me"); }
export function updateProfile(body: { name: string; email: string; phone: string }) { return request<SessionUser>("/auth/me", "PATCH", body); }
export async function logoutWithApi() { try { await request("/auth/logout", "POST"); } finally { localStorage.removeItem("mediassure-token"); localStorage.removeItem("mediassure-session"); } }

async function authenticate(path: string, body: unknown) {
  const payload = await request<{ access_token: string; user: SessionUser }>(path, "POST", body);
  localStorage.setItem("mediassure-token", payload.access_token);
  return payload.user;
}
export function loginWithApi(email: string, password: string, role: SessionUser["role"]) { return authenticate("/auth/login", { email, password, role }); }
export function signupWithApi(body: { email: string; name: string; password: string; phone?: string; role: SessionUser["role"] }) { return authenticate("/auth/signup", body); }

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const s = await request<{ active_medicines: number; low_stock_risk: number; pending_reservations: number; transfer_suggestions: number; api_mode: string }>("/dashboard/summary");
  return { activeMedicines: s.active_medicines, lowStockRisk: s.low_stock_risk, pendingReservations: s.pending_reservations, transferSuggestions: s.transfer_suggestions, apiMode: s.api_mode };
}
type RawInventory = { medicine_name?: string; strength?: string; requires_prescription?: boolean; id: number; pharmacy_name: string; medicine: string; generic: string; category: string; stock: number; reserved: number; reorder_level: number; predicted_24h: number; status: InventoryItem["status"]; risk: InventoryItem["risk"]; updated: string };
export async function fetchInventory(): Promise<InventoryItem[]> {
  return (await request<RawInventory[]>("/inventory")).map(i => ({ ...i, medicineName: i.medicine_name, requiresPrescription: i.requires_prescription, pharmacyName: i.pharmacy_name, reorderLevel: i.reorder_level, predicted24h: i.predicted_24h }));
}
export function createInventory(body: Record<string, unknown>) { return request("/inventory", "POST", body); }
export function updateInventory(id: number, body: Record<string, unknown>) { return request(`/inventory/${id}`, "PATCH", body); }
export function deleteInventory(id: number) { return request(`/inventory/${id}`, "DELETE"); }
export function fetchMyLocation() { return request<MedicineLocation | null>("/pharmacies/mine"); }
export function updateLocation(body: Record<string, unknown>) { return request<MedicineLocation>("/pharmacies/mine", "PATCH", body); }

export async function fetchReservations(): Promise<Reservation[]> {
  const rows = await request<{ id: string; can_manage: boolean; pharmacy_name: string; patient: string; medicine: string; quantity: number; expires_at: string; status: string }[]>("/reservations");
  return rows.map(i => ({ id: i.id, canManage: i.can_manage, pharmacyName: i.pharmacy_name, patient: i.patient, medicine: i.medicine, qty: i.quantity, eta: i.expires_at, status: i.status }));
}
export function createReservation(inventory_id: number, quantity: number) { return request("/reservations", "POST", { inventory_id, quantity }); }
export function updateReservation(id: string, status: string) { return request(`/reservations/${id}`, "PATCH", { status }); }

export async function fetchPharmacyRecommendations(query: string, latitude: number, longitude: number, quantity: number): Promise<PharmacyMatch[]> {
  if (!query.trim()) return [];
  const medicines = await request<{ id: number; name: string; strength: string }[]>(`/medicines/search?query=${encodeURIComponent(query)}`);
  if (!medicines.length) return [];
  const results = await Promise.all(medicines.map(async medicine => {
    const rows = await request<{ id: number; location_type: "Pharmacy" | "Hospital"; latitude: number; longitude: number; updated_at: string; name: string; area: string; distance_km: number; travel_time_minutes: number; contact_number: string; current_stock: number; availability_confidence: number; emergency_rescue_score: number; verified: boolean }[]>(`/pharmacies/recommendations?medicine_id=${medicine.id}&latitude=${latitude}&longitude=${longitude}&quantity=${quantity}`);
    return rows.map(i => ({ inventoryId: i.id, locationType: i.location_type, latitude: i.latitude, longitude: i.longitude, updatedAt: i.updated_at, name: i.name, area: i.area, distance: `${i.distance_km.toFixed(1)} km`, eta: `${i.travel_time_minutes} min`, phone: i.contact_number, medicine: [medicine.name, medicine.strength].filter(Boolean).join(" "), stock: i.current_stock, confidence: Math.round(i.availability_confidence * 100), rescueScore: Math.round(i.emergency_rescue_score), verified: i.verified }));
  }));
  return results.flat().sort((a, b) => b.rescueScore - a.rescueScore);
}
export async function fetchNetworkPharmacies(): Promise<NetworkPharmacy[]> {
  const rows = await request<{ id: number; contact_number: string; name: string; location_type: "Pharmacy" | "Hospital"; area: string; status: NetworkPharmacy["status"]; open_until: string; stock_health: number; urgent_gaps: number; last_sync: string; latitude: number | null; longitude: number | null }[]>("/pharmacies");
  return rows.map(i => ({ ...i, phone: i.contact_number, locationType: i.location_type, openUntil: i.open_until, stockHealth: i.stock_health, urgentGaps: i.urgent_gaps, lastSync: i.last_sync }));
}
export function fetchAlerts() { return request<OperationalAlert[]>("/operations/alerts"); }
export function fetchAuditEvents() { return request<AuditEvent[]>("/operations/audit-events"); }
export function fetchForecasts() { return request<DemandForecast[]>("/operations/forecasts"); }
export function fetchTransfers() { return request<TransferSuggestion[]>("/operations/transfers"); }
export type CompletedTransfer = { id: number; from: string; to: string; medicine: string; qty: number; status: string; created_at: string };
export function fetchTransferHistory() { return request<CompletedTransfer[]>("/operations/transfer-history"); }
export function recordTransfer(body: { from_inventory_id: number; to_inventory_id: number; quantity: number; request_key: string }) { return request<CompletedTransfer>("/operations/transfers", "POST", body); }
export type EmailDelivery = { transport: "disabled" | "file" | "smtp"; messages: { id: number; subject: string; status: string; attempts: number; last_error: string | null; created_at: string; sent_at: string | null }[] };
export function fetchEmailDelivery() { return request<EmailDelivery>("/operations/emails"); }
export function emailMyAlerts() { return request<{ queued: number }>("/operations/alerts/email", "POST"); }
export function retryEmail(id: number) { return request("/operations/emails/" + id + "/retry", "POST"); }
export function fetchVerifiedAlternatives() { return request<VerifiedAlternative[]>("/operations/verified-alternatives"); }
export function fetchUsers() { return request<SessionUser[]>("/admin/users"); }
export function approveUser(id: number) { return request(`/admin/users/${id}/approve`, "POST"); }


export type LocationStock = { id: number; medicine: string; generic: string; strength: string; available: number; updated_at: string };
export function fetchLocationStock(id: number) { return request<LocationStock[]>(`/pharmacies/${id}/stock`); }
