import type { ReactNode } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, ClipboardList, Pill, Truck } from "lucide-react";
import type { DashboardSummary } from "../services/api";
import type { InventoryItem, PharmacyMatch } from "../types";
import { AvailabilityCard, BarChart, EmptyState, InventoryTable, Metric, Panel, StatusBadge } from "../components/ui";

export function DashboardPage({
  items,
  matches,
  summary,
}: {
  items: InventoryItem[];
  matches: PharmacyMatch[];
  summary: DashboardSummary | null;
}) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Pill size={20} />} label="Active medicines" value={(summary?.activeMedicines ?? items.length).toString()} tone="teal" />
        <Metric icon={<AlertTriangle size={20} />} label="Low stock risk" value={(summary?.lowStockRisk ?? 0).toString()} tone="danger" />
        <Metric icon={<CalendarClock size={20} />} label="Pending reservations" value={(summary?.pendingReservations ?? 0).toString()} tone="amber" />
        <Metric icon={<Truck size={20} />} label="Transfer suggestions" value={(summary?.transferSuggestions ?? 0).toString()} tone="navy" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Panel title="Critical Stock Watch">
          <InventoryTable items={items.slice(0, 4)} compact />
        </Panel>
        <Panel title="Emergency Availability">
          <div className="grid gap-3">
            {matches.length === 0 && <EmptyState title="No backend recommendations" detail="Backend returned no emergency availability records." />}
            {matches.slice(0, 2).map((match) => (
              <AvailabilityCard
                key={`${match.name}-${match.medicine}`}
                medicine={match.medicine}
                confidence={match.confidence}
                eta={match.eta}
                pharmacy={match.name}
                stock={`${match.stock} units`}
              />
            ))}
            <div className="rounded-md border border-[#BFD9DB] bg-[#F8FCFC] p-4">
              <p className="text-sm font-semibold text-[#092C46]">AI recommendation</p>
              <p className="mt-2 text-sm text-[#557084]">
                {items[0] ? `Prioritize ${items[0].medicine} before peak demand.` : "No inventory recommendation from backend yet."}
              </p>
            </div>
          </div>
        </Panel>
      </div>

      {items.length > 0 && (
        <div className="grid gap-5 xl:grid-cols-2">
          <BarChart
            data={items.map((item) => ({ label: item.medicine, value: item.stock - item.reserved }))}
            valueKey="Available stock by medicine"
          />
          <BarChart data={items.map((item) => ({ label: item.medicine, value: item.predicted24h }))} valueKey="Predicted 24h demand" />
        </div>
      )}

      <Panel title="Today Work Queue">
        <div className="grid gap-3 lg:grid-cols-3">
          <QueueCard icon={<ClipboardList size={18} />} title="Review transfer" detail="Approve WellCare to City Care Salbutamol move." status="Due now" tone="amber" />
          <QueueCard icon={<CheckCircle2 size={18} />} title="Confirm pickup" detail="Emergency reservation R-1024 needs handoff update." status="Ready" tone="teal" />
          <QueueCard icon={<AlertTriangle size={18} />} title="Validate delay" detail="Union Med House has not synced for 31 minutes." status="Risk" tone="danger" />
        </div>
      </Panel>
    </div>
  );
}

function QueueCard({
  icon,
  title,
  detail,
  status,
  tone,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  status: string;
  tone: "teal" | "amber" | "danger";
}) {
  return (
    <article className="rounded-md border border-[#BFD9DB] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#E9F0F5] text-[#092C46]">{icon}</div>
        <StatusBadge label={status} tone={tone} />
      </div>
      <h3 className="mt-4 font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#557084]">{detail}</p>
    </article>
  );
}
