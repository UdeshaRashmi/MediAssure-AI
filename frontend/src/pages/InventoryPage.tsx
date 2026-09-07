import { Plus } from "lucide-react";
import type { InventoryItem } from "../types";
import { InventoryTable, Panel } from "../components/ui";

export function InventoryPage({ items }: { items: InventoryItem[] }) {
  return (
    <Panel
      title="Inventory Management"
      action={
        <button className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0D8F93] px-4 text-sm font-bold text-white">
          <Plus size={17} />
          Add Stock
        </button>
      }
    >
      <InventoryTable items={items} />
    </Panel>
  );
}
