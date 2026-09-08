import { useMemo, useState } from "react";
import { AlertTriangle, Boxes, PackageCheck, Plus } from "lucide-react";
import type { InventoryItem, StockStatus } from "../types";
import { EmptyState, InventoryTable, Metric, Modal, Panel } from "../components/ui";

const filters: ("All" | StockStatus)[] = ["All", "Low", "Watch", "Healthy"];

export function InventoryPage({ items }: { items: InventoryItem[] }) {
  const [status, setStatus] = useState<"All" | StockStatus>("All");
  const [stockFormOpen, setStockFormOpen] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
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
          <button
            type="button"
            onClick={() => setStockFormOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0D8F93] px-4 text-sm font-bold text-white"
          >
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

      {savedMessage && (
        <div className="rounded-md border border-[#BFD9DB] bg-white p-4 text-sm font-bold text-[#0D8F93]">{savedMessage}</div>
      )}

      <Modal title="Add Stock" open={stockFormOpen} onClose={() => setStockFormOpen(false)}>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setSavedMessage(`Stock update prepared for ${form.get("medicine")} at ${form.get("pharmacy")}.`);
            setStockFormOpen(false);
          }}
        >
          <label className="block">
            <span className="text-xs font-bold uppercase text-[#557084]">Medicine</span>
            <select name="medicine" className="mt-2 w-full rounded-md border border-[#BFD9DB] bg-[#F8FCFC] px-3 py-3 outline-none">
              {items.map((item) => (
                <option key={item.medicine}>{item.medicine}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase text-[#557084]">Pharmacy</span>
            <input
              name="pharmacy"
              defaultValue="City Care Pharmacy"
              className="mt-2 w-full rounded-md border border-[#BFD9DB] bg-[#F8FCFC] px-3 py-3 outline-none"
              required
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold uppercase text-[#557084]">Quantity added</span>
              <input
                name="quantity"
                type="number"
                min={1}
                defaultValue={10}
                className="mt-2 w-full rounded-md border border-[#BFD9DB] bg-[#F8FCFC] px-3 py-3 outline-none"
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase text-[#557084]">Batch number</span>
              <input
                name="batch"
                placeholder="BATCH-001"
                className="mt-2 w-full rounded-md border border-[#BFD9DB] bg-[#F8FCFC] px-3 py-3 outline-none"
                required
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-bold uppercase text-[#557084]">Expiry date</span>
            <input
              name="expiry"
              type="date"
              className="mt-2 w-full rounded-md border border-[#BFD9DB] bg-[#F8FCFC] px-3 py-3 outline-none"
              required
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setStockFormOpen(false)} className="h-10 rounded-md border border-[#BFD9DB] px-4 text-sm font-bold text-[#31556A]">
              Cancel
            </button>
            <button className="h-10 rounded-md bg-[#0D8F93] px-4 text-sm font-bold text-white">Save stock</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
