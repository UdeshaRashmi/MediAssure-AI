import type { DashboardSummary } from "../services/api";
import type { InventoryItem, PharmacyMatch } from "../types";
import { EmptyState, InventoryTable, Panel } from "../components/ui";
import { useI18n } from "../i18n";
export function DashboardPage({ items, summary }: { items: InventoryItem[]; matches: PharmacyMatch[]; summary: DashboardSummary | null }) {
  const { t } = useI18n();
  return <div className="grid gap-5"><div className="grid gap-3 sm:grid-cols-3">{[["Active medicines", summary?.activeMedicines ?? 0], ["Low stock risk", summary?.lowStockRisk ?? 0], ["Pending reservations", summary?.pendingReservations ?? 0]].map(([label, value]) => <article className="rounded border bg-white p-4" key={label}><p>{t(String(label))}</p><p className="text-3xl font-bold">{value}</p></article>)}</div><Panel title="Current inventory">{items.length ? <InventoryTable items={items} /> : <EmptyState title="No inventory records" detail="Add medicines through the inventory page to see your real stock here." />}</Panel></div>;
}
