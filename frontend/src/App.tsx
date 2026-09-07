import { useMemo, useState } from "react";
import { Sidebar, SearchBox, TopBar } from "./components/Layout";
import { inventory, pharmacyMatches } from "./data/mockData";
import { AlertsPage } from "./pages/AlertsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { FinderPage } from "./pages/FinderPage";
import { InventoryPage } from "./pages/InventoryPage";
import { RebalancingPage } from "./pages/RebalancingPage";
import { ReservationsPage } from "./pages/ReservationsPage";
import type { Page } from "./types";

export function App() {
  const [activePage, setActivePage] = useState<Page>("finder");
  const [query, setQuery] = useState("");
  const [reservedPharmacy, setReservedPharmacy] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const filteredMatches = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return pharmacyMatches;
    return pharmacyMatches.filter(
      (match) =>
        match.medicine.toLowerCase().includes(normalized) ||
        match.name.toLowerCase().includes(normalized) ||
        match.area.toLowerCase().includes(normalized),
    );
  }, [query]);

  const handleNavigate = (page: Page) => {
    setActivePage(page);
    setMenuOpen(false);
  };

  return (
    <main className="min-h-screen bg-[#F2F7F7] text-[#092C46]">
      <TopBar menuOpen={menuOpen} onMenuToggle={() => setMenuOpen((open) => !open)} />
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[260px_1fr]">
        <Sidebar activePage={activePage} menuOpen={menuOpen} onNavigate={handleNavigate} />

        <section className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase text-[#0D8F93]">Live operations</p>
              <h1 className="text-2xl font-bold">{pageTitle(activePage)}</h1>
            </div>
            <SearchBox value={query} onChange={setQuery} />
          </div>

          {activePage === "finder" && (
            <FinderPage
              matches={filteredMatches}
              query={query}
              reservedPharmacy={reservedPharmacy}
              onReserve={setReservedPharmacy}
            />
          )}
          {activePage === "dashboard" && <DashboardPage items={filteredInventory} />}
          {activePage === "inventory" && <InventoryPage items={filteredInventory} />}
          {activePage === "reservations" && <ReservationsPage />}
          {activePage === "rebalancing" && <RebalancingPage />}
          {activePage === "alerts" && <AlertsPage />}
        </section>
      </div>
    </main>
  );
}

function pageTitle(page: Page) {
  return {
    finder: "Medicine Finder",
    dashboard: "Pharmacist Dashboard",
    inventory: "Inventory Management",
    reservations: "Emergency Reservations",
    rebalancing: "Stock Rebalancing",
    alerts: "Alerts and Sync Status",
  }[page];
}
