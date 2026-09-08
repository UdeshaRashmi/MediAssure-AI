import { useEffect, useMemo, useState } from "react";
import { Sidebar, SearchBox, TopBar } from "./components/Layout";
import { inventory, pharmacyMatches } from "./data/mockData";
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
import { checkApiHealth, fetchPharmacyRecommendations, type ApiStatus } from "./services/api";
import type { Page, PharmacyMatch, SessionUser } from "./types";

const sessionKey = "mediassure-session";

export function App() {
  const [activePage, setActivePage] = useState<Page>("request");
  const [query, setQuery] = useState("");
  const [reservedPharmacy, setReservedPharmacy] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const [apiMatches, setApiMatches] = useState<PharmacyMatch[] | null>(null);
  const [matchesLoading, setMatchesLoading] = useState(false);
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
  }, [query]);

  const localMatches = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return pharmacyMatches;
    return pharmacyMatches.filter(
      (match) =>
        match.medicine.toLowerCase().includes(normalized) ||
        match.name.toLowerCase().includes(normalized) ||
        match.area.toLowerCase().includes(normalized),
    );
  }, [query]);

  const filteredMatches = apiMatches ?? localMatches;

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
    if (apiStatus !== "online") {
      setApiMatches(null);
      setMatchesLoading(false);
      return;
    }

    let alive = true;
    setMatchesLoading(true);

    fetchPharmacyRecommendations(query)
      .then((matches) => {
        if (alive) setApiMatches(matches);
      })
      .catch(() => {
        if (alive) {
          setApiStatus("offline");
          setApiMatches(null);
        }
      })
      .finally(() => {
        if (alive) setMatchesLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [apiStatus, query]);

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

          {visiblePage === "finder" && (
            <FinderPage
              matches={filteredMatches}
              matchesLoading={matchesLoading}
              matchSource={apiMatches ? "api" : "mock"}
              query={query}
              reservedPharmacy={reservedPharmacy}
              onReserve={setReservedPharmacy}
            />
          )}
          {visiblePage === "request" && <RequestPage onNavigate={handleNavigate} />}
          {visiblePage === "dashboard" && <DashboardPage items={filteredInventory} />}
          {visiblePage === "inventory" && <InventoryPage items={filteredInventory} />}
          {visiblePage === "forecast" && <ForecastPage />}
          {visiblePage === "reservations" && <ReservationsPage />}
          {visiblePage === "rebalancing" && <RebalancingPage />}
          {visiblePage === "network" && <NetworkPage />}
          {visiblePage === "alerts" && <AlertsPage />}
          {visiblePage === "settings" && <SettingsPage user={user} />}
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
