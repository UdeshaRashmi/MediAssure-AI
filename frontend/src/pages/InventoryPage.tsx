import { useMemo, useState } from "react";
import { AlertTriangle, Boxes, PackageCheck, Plus } from "lucide-react";
import type { InventoryItem, StockStatus } from "../types";
import { EmptyState, InventoryTable, Metric, Panel } from "../components/ui";

const filters: ("All" | StockStatus)[] = ["All", "Low", "Watch", "Healthy"];

export function InventoryPage({ items }: { items: InventoryItem[] }) {
  const [status, setStatus] = useState<"All" | StockStatus>("All");
  const visibleItems = useMemo(() => (status === "All" ? items : items.filter((item) => item.status === status)), [items, status]);
  const lowCount = items.filter((item) => item.status === "Low").length;
  const reserved = items.reduce((sum, item) => sum + item.reserved, 0);

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric icon={<Boxes size={20} />} label="Listed medicines" value={items.length.toString()} tone="navy" />
        <Metric icon={<AlertTriangle size={20} />} label="Low stock items" value={lowCount.toString()} tone="danger" />
        <Metric icon={<PackageCheck size={20} />} label="Reserved units" value={reserved.toString()} tone="amber" />
      </div>

      <Panel
        title="Inventory Management"
        action={
          <button className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0D8F93] px-4 text-sm font-bold text-white">
            <Plus size={17} />
            Add Stock
          </button>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setStatus(filter)}
              className={`h-9 rounded-md border px-3 text-sm font-bold ${
                status === filter ? "border-[#0D8F93] bg-[#E7F7F6] text-[#0D8F93]" : "border-[#BFD9DB] bg-white text-[#31556A]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        {visibleItems.length > 0 ? (
          <InventoryTable items={visibleItems} />
        ) : (
          <EmptyState title="No inventory records" detail="Change the status filter or search term to view available records." />
        )}
      </Panel>
    </div>
  );
}
