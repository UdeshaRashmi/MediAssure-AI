import { AlertTriangle, CalendarClock, Pill, Truck } from "lucide-react";
import type { InventoryItem } from "../types";
import { AvailabilityCard, InventoryTable, Metric, Panel } from "../components/ui";

export function DashboardPage({ items }: { items: InventoryItem[] }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Pill size={20} />} label="Active medicines" value="128" tone="teal" />
        <Metric icon={<AlertTriangle size={20} />} label="Low stock risk" value="7" tone="danger" />
        <Metric icon={<CalendarClock size={20} />} label="Pending reservations" value="3" tone="amber" />
        <Metric icon={<Truck size={20} />} label="Transfer suggestions" value="2" tone="navy" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Panel title="Critical Stock Watch">
          <InventoryTable items={items.slice(0, 4)} compact />
        </Panel>
        <Panel title="Emergency Availability">
          <div className="grid gap-3">
            <AvailabilityCard medicine="Salbutamol Inhaler" confidence={95} eta="9 min" stock="10 units" />
            <AvailabilityCard medicine="Insulin Rapid Acting" confidence={76} eta="18 min" stock="4 units" />
            <div className="rounded-md border border-[#BFD9DB] bg-[#F8FCFC] p-4">
              <p className="text-sm font-semibold text-[#092C46]">AI recommendation</p>
              <p className="mt-2 text-sm text-[#557084]">Prioritize Salbutamol transfer before peak evening demand.</p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
