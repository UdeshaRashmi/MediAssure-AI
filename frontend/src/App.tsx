import { useEffect, useMemo, useState } from "react";
import { Sidebar, SearchBox, TopBar } from "./components/Layout";
import { EmptyState, LoadingState } from "./components/ui";
import { AlertsPage } from "./pages/AlertsPage";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ForecastPage } from "./pages/ForecastPage";
import { FinderPage } from "./pages/FinderPage";
import { InventoryPage } from "./pages/InventoryPage";
import { NetworkPage } from "./pages/NetworkPage";
import { RebalancingPage } from "./pages/RebalancingPage";
import { ReservationsPage } from "./pages/ReservationsPage";
import { RequestPage } from "./pages/RequestPage";
import { SettingsPage } from "./pages/SettingsPage";
import { canAccessPage, defaultPageByRole } from "./roleAccess";
import {
  checkApiHealth,
  fetchAuditEvents,
  fetchAlerts,
  fetchDashboardSummary,
  fetchForecasts,
  fetchInventory,
  fetchNetworkPharmacies,
  fetchPharmacyRecommendations,
  fetchReservations,
  fetchTransfers,
  fetchVerifiedAlternatives,
  type ApiStatus,
  type DashboardSummary,
} from "./services/api";
import type {
  DemandForecast,
  AuditEvent,
  InventoryItem,
  NetworkPharmacy,
  OperationalAlert,
  Page,
  PharmacyMatch,
  Reservation,
  SessionUser,
  TransferSuggestion,
  VerifiedAlternative,
} from "./types";

const sessionKey = "mediassure-session";

export function App() {
  const [activePage, setActivePage] = useState<Page>("request");
  const [query, setQuery] = useState("");
  const [reservedPharmacy, setReservedPharmacy] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const [matches, setMatches] = useState<PharmacyMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [transfers, setTransfers] = useState<TransferSuggestion[]>([]);
  const [forecasts, setForecasts] = useState<DemandForecast[]>([]);
  const [networkPharmacies, setNetworkPharmacies] = useState<NetworkPharmacy[]>([]);
  const [alerts, setAlerts] = useState<OperationalAlert[]>([]);
  const [verifiedAlternatives, setVerifiedAlternatives] = useState<VerifiedAlternative[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [appLoading, setAppLoading] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(() => {
    const saved = window.localStorage.getItem(sessionKey);
    try {
      return saved ? (JSON.parse(saved) as SessionUser) : null;
    } catch {
      window.localStorage.removeItem(sessionKey);
      return null;
    }
  });

  const filteredInventory = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return inventory;
    return inventory.filter(
      (item) =>
        item.medicine.toLowerCase().includes(normalized) ||
        item.generic.toLowerCase().includes(normalized) ||
        item.category.toLowerCase().includes(normalized),
    );
  }, [inventory, query]);

  useEffect(() => {
    let alive = true;

    checkApiHealth().then((online) => {
      if (alive) setApiStatus(online ? "online" : "offline");
    });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    let alive = true;
    setAppLoading(true);
    setAppError(null);

    Promise.all([
      fetchDashboardSummary(),
      fetchInventory(),
      fetchReservations(),
      fetchTransfers(),
      fetchForecasts(),
      fetchNetworkPharmacies(),
      fetchAlerts(),
      fetchVerifiedAlternatives(),
      fetchAuditEvents(),
    ])
      .then(([summary, nextInventory, nextReservations, nextTransfers, nextForecasts, nextNetwork, nextAlerts, nextAlternatives, nextAuditEvents]) => {
        if (!alive) return;
        setDashboardSummary(summary);
        setInventory(nextInventory);
        setReservations(nextReservations);
        setTransfers(nextTransfers);
        setForecasts(nextForecasts);
        setNetworkPharmacies(nextNetwork);
        setAlerts(nextAlerts);
        setVerifiedAlternatives(nextAlternatives);
        setAuditEvents(nextAuditEvents);
        setApiStatus("online");
      })
      .catch(() => {
        if (!alive) return;
        setApiStatus("offline");
        setAppError("Backend API is required. Start FastAPI on http://localhost:8000 and refresh the app.");
      })
      .finally(() => {
        if (alive) setAppLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    if (apiStatus !== "online") {
      setMatches([]);
      setMatchesLoading(false);
      return;
    }

    let alive = true;
    setMatchesLoading(true);

    fetchPharmacyRecommendations(query)
      .then((nextMatches) => {
        if (alive) setMatches(nextMatches);
      })
      .catch(() => {
        if (alive) {
          setApiStatus("offline");
          setMatches([]);
          setAppError("Backend API is required for pharmacy recommendations.");
        }
      })
      .finally(() => {
        if (alive) setMatchesLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [apiStatus, query, user]);

  const handleNavigate = (page: Page) => {
    if (user && !canAccessPage(user.role, page)) {
      return;
    }

    setActivePage(page);
    setMenuOpen(false);
  };

  const handleLogin = (nextUser: SessionUser) => {
    window.localStorage.setItem(sessionKey, JSON.stringify(nextUser));
    setUser(nextUser);
    setActivePage(defaultPageByRole[nextUser.role]);
  };

  const handleLogout = () => {
    window.localStorage.removeItem(sessionKey);
    window.localStorage.removeItem("mediassure-token");
    window.localStorage.removeItem("mediassure-token-expires-at");
    setUser(null);
    setActivePage("request");
  };

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  const visiblePage = canAccessPage(user.role, activePage) ? activePage : defaultPageByRole[user.role];

  return (
    <main className="min-h-screen bg-[#F2F7F7] text-[#092C46]">
      <TopBar
        apiStatus={apiStatus}
        menuOpen={menuOpen}
        user={user}
        onLogout={handleLogout}
        onMenuToggle={() => setMenuOpen((open) => !open)}
      />
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[260px_1fr]">
        <Sidebar activePage={visiblePage} apiStatus={apiStatus} menuOpen={menuOpen} user={user} onNavigate={handleNavigate} />

        <section className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase text-[#0D8F93]">{roleEyebrow(user.role)}</p>
              <h1 className="text-2xl font-bold">{pageTitle(visiblePage)}</h1>
            </div>
            <SearchBox value={query} onChange={setQuery} />
          </div>

          {appLoading && <LoadingState label="Loading backend data" />}
          {appError && <EmptyState title="Backend connection required" detail={appError} />}
          {!appLoading && !appError && visiblePage === "finder" && (
            <FinderPage
              matches={matches}
              matchesLoading={matchesLoading}
              matchSource="api"
              query={query}
              reservedPharmacy={reservedPharmacy}
              onReserve={setReservedPharmacy}
            />
          )}
          {!appLoading && !appError && visiblePage === "request" && (
            <RequestPage matches={matches} verifiedAlternatives={verifiedAlternatives} onNavigate={handleNavigate} />
          )}
          {!appLoading && !appError && visiblePage === "dashboard" && (
            <DashboardPage items={filteredInventory} matches={matches} summary={dashboardSummary} />
          )}
          {!appLoading && !appError && visiblePage === "inventory" && <InventoryPage items={filteredInventory} />}
          {!appLoading && !appError && visiblePage === "forecast" && <ForecastPage forecasts={forecasts} />}
          {!appLoading && !appError && visiblePage === "reservations" && <ReservationsPage reservations={reservations} />}
          {!appLoading && !appError && visiblePage === "rebalancing" && <RebalancingPage transfers={transfers} />}
          {!appLoading && !appError && visiblePage === "network" && <NetworkPage networkPharmacies={networkPharmacies} />}
          {!appLoading && !appError && visiblePage === "alerts" && <AlertsPage alerts={alerts} />}
          {!appLoading && !appError && visiblePage === "settings" && <SettingsPage auditEvents={auditEvents} user={user} />}
        </section>
      </div>
    </main>
  );
}

function pageTitle(page: Page) {
  return {
    finder: "Medicine Finder",
    request: "Emergency Request",
    dashboard: "Pharmacist Dashboard",
    inventory: "Inventory Management",
    forecast: "Demand Forecasting",
    reservations: "Emergency Reservations",
    rebalancing: "Stock Rebalancing",
    network: "Pharmacy Network",
    alerts: "Alerts and Sync Status",
    settings: "Settings and Governance",
  }[page];
}

function roleEyebrow(role: SessionUser["role"]) {
  return {
    Patient: "Emergency user workspace",
    Pharmacist: "Pharmacy operations",
    "Hospital Staff": "Hospital coordination",
    Admin: "System administration",
  }[role];
}
