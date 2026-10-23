import { LocationPicker } from "./components/LocationPicker";
import { ValidatedForm, ValidatedInput } from "./components/ValidatedForm";
import { useEffect, useState } from "react";
import { Sidebar, TopBar } from "./components/Layout";
import { EmptyState, LoadingState } from "./components/ui";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { FinderPage } from "./pages/FinderPage";
import { InventoryPage } from "./pages/InventoryPage";
import { ReservationsPage } from "./pages/ReservationsPage";
import { RequestPage } from "./pages/RequestPage";
import { SettingsPage } from "./pages/SettingsPage";
import { NetworkPage } from "./pages/NetworkPage";
import { canAccessPage, defaultPageByRole } from "./roleAccess";
import { LanguageSwitch, useI18n } from "./i18n";
import * as api from "./services/api";
import type { AuditEvent, InventoryItem, NetworkPharmacy, OperationalAlert, Page, PharmacyMatch, Reservation, SessionUser } from "./types";

export function App() {
  const { t } = useI18n();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [activePage, setActivePage] = useState<Page>("request");
  const [menuOpen, setMenuOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const refresh = () => setRevision(value => value + 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [network, setNetwork] = useState<NetworkPharmacy[]>([]);
  const [alerts, setAlerts] = useState<OperationalAlert[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [summary, setSummary] = useState<api.DashboardSummary | null>(null);
  const [matches, setMatches] = useState<PharmacyMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [latitude, setLatitude] = useState(""); const [longitude, setLongitude] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [search, setSearch] = useState<{ query: string; latitude: number; longitude: number; quantity: number } | null>(null);

  function signedIn(next: SessionUser) { setUser(next); setActivePage(defaultPageByRole[next.role]); setError(""); }
  useEffect(() => {
    let alive = true;
    const expired = () => { localStorage.removeItem("mediassure-token"); localStorage.removeItem("mediassure-session"); setUser(null); };
    window.addEventListener("mediassure-session-expired", expired);
    if (localStorage.getItem("mediassure-token")) api.fetchCurrentUser().then(next => { if (alive) signedIn(next); }).catch(() => { if (alive) expired(); }).finally(() => { if (alive) setCheckingSession(false); });
    else setCheckingSession(false);
    return () => { alive = false; window.removeEventListener("mediassure-session-expired", expired); };
  }, []);

  useEffect(() => {
    setMatches([]); setSearch(null); setInventory([]); setReservations([]); setNetwork([]); setAudit([]); setAlerts([]); setSummary(null);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.approved) return;
    let alive = true; setLoading(true); setError("");
    const operator = user.role === "Pharmacist" || user.role === "Admin";
    Promise.all([
      operator ? api.fetchDashboardSummary() : Promise.resolve(null),
      (operator || user.role === "Hospital Staff") ? api.fetchInventory() : Promise.resolve([]),
      api.fetchReservations(),
      api.fetchNetworkPharmacies(),
      user.role !== "Patient" ? api.fetchAlerts() : Promise.resolve([]), api.fetchAuditEvents(),
    ]).then(([nextSummary, nextInventory, nextReservations, nextNetwork, nextAlerts, nextAudit]) => {
      if (!alive) return;
      setSummary(nextSummary); setInventory(nextInventory); setReservations(nextReservations); setNetwork(nextNetwork); setAlerts(nextAlerts); setAudit(nextAudit);
    }).catch(error => { if (alive) setError(error instanceof Error ? error.message : "Request failed. Please try again."); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [user, revision]);

  useEffect(() => {
    if (!user?.approved || !search || !["Patient", "Hospital Staff"].includes(user.role)) return;
    let alive = true; setMatchesLoading(true);
    api.fetchPharmacyRecommendations(search.query, search.latitude, search.longitude, search.quantity).then(rows => { if (alive) setMatches(rows); }).catch(error => { if (alive) { setMatches([]); setError(error.message); } }).finally(() => { if (alive) setMatchesLoading(false); });
    return () => { alive = false; };
  }, [search, user, revision]);

  async function signOut() { try { await api.logoutWithApi(); } catch { /* Local session is cleared even if the server is unavailable. */ } finally { setUser(null); setError(""); } }
  if (checkingSession) return <LoadingState label="Checking session..." />;
  if (!user) return <AuthPage onLogin={signedIn} />;
  if (!user.approved) return <main className="mx-auto grid max-w-xl gap-4 p-6"><LanguageSwitch /><h1 className="text-2xl font-bold">{t("Account awaiting approval")}</h1><p>{t("Your staff account has been created. An administrator must approve it before you can access this workspace.")}</p><p>{user.name} ? {t(user.role)}</p><button className="action" onClick={async () => { try { signedIn(await api.fetchCurrentUser()); } catch (error) { setError((error as Error).message); } }}>{t("Check approval")}</button><button className="secondary" onClick={signOut}>{t("Sign out")}</button>{error && <p role="alert">{t(error)}</p>}</main>;
  const page = canAccessPage(user.role, activePage) ? activePage : defaultPageByRole[user.role];
  const titles: Record<Page, string> = { request: "Emergency Request", finder: "Medicine Finder", dashboard: user.role === "Admin" ? "Administration Dashboard" : "Pharmacist Dashboard", inventory: user.role === "Hospital Staff" ? "Hospital medicine stock" : "Inventory Management", forecast: "Demand Forecasting", reservations: "Reservations", rebalancing: "Stock Rebalancing", network: "Sri Lanka map", alerts: "Alerts", settings: "Account and Settings" };
  const finderProps = { matches, loading: matchesLoading, quantity: search?.quantity ?? Number(quantity), onChanged: refresh };
  return <main className="min-h-screen bg-[#F2F7F7] text-[#092C46]">
    <TopBar apiStatus={error ? "offline" : "online"} user={user} menuOpen={menuOpen} onMenuToggle={() => setMenuOpen(v => !v)} onLogout={signOut} />
    <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[260px_1fr]">
      <Sidebar activePage={page} apiStatus={error ? "offline" : "online"} menuOpen={menuOpen} user={user} onNavigate={next => { if (canAccessPage(user.role, next)) setActivePage(next); setMenuOpen(false); }} />
      <section className="min-w-0"><div className="mb-5 flex items-center justify-between gap-3"><h1 className="text-2xl font-bold">{t(titles[page])}</h1><button className="secondary" disabled={loading} onClick={refresh}>{t("Refresh")}</button></div>
        {error && <p className="mb-4 rounded border border-red-300 bg-white p-4" role="alert">{t(error)}</p>}
        {loading && <LoadingState label="Loading data..." />}
        {!loading && <>
          {["finder", "request"].includes(page) && <ValidatedForm className="mb-5 grid gap-3 rounded border bg-white p-4 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); setError(""); setSearch({ query, latitude: Number(latitude), longitude: Number(longitude), quantity: Number(quantity) }); }}>
            <label>{t("Medicine needed")}<ValidatedInput className="field" name="query" maxLength={160} value={query} onChange={e => setQuery(e.target.value)} required /></label>
            <label>{t("Quantity")}<ValidatedInput className="field" name="quantity" type="number" min={1} max={2147483647} value={quantity} onChange={e => setQuantity(e.target.value)} required /></label>
            <LocationPicker className="sm:col-span-2" latitude={latitude} longitude={longitude} onChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }} />
            <button className="action" disabled={matchesLoading}>{t("Search pharmacies")}</button>
          </ValidatedForm>}
          {page === "request" && <RequestPage {...finderProps} />}
          {page === "finder" && <FinderPage {...finderProps} />}
          {page === "dashboard" && <DashboardPage items={inventory} matches={[]} summary={summary} />}
          {page === "inventory" && <InventoryPage items={inventory} user={user} onChanged={refresh} />}
          {page === "reservations" && <ReservationsPage reservations={reservations} user={user} onChanged={refresh} />}
          {page === "network" && <NetworkPage networkPharmacies={network} />}
          {page === "alerts" && <div className="grid gap-3">{alerts.length ? alerts.map((alert, index) => <article className="rounded border bg-white p-4" key={index}><h2 className="font-bold">{alert.title}</h2><p>{alert.detail}</p></article>) : <EmptyState title="No alerts" detail="No low-stock alerts from your current inventory." />}</div>}
          {page === "forecast" && <EmptyState title="No forecasts available" detail="Demand forecasting requires recorded sales history and a validated prediction model. No sample predictions are shown." />}
          {page === "rebalancing" && <EmptyState title="No transfer suggestions" detail="Stock transfers are not enabled yet. No sample suggestions are shown." />}
          {page === "settings" && <SettingsPage auditEvents={audit} user={user} />}
        </>}
      </section>
    </div>
  </main>;
}
