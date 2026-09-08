import type { TransferSuggestion } from "../types";
import { EmptyState, Panel } from "../components/ui";

export function RebalancingPage({ transfers }: { transfers: TransferSuggestion[] }) {
  return (
    <Panel title="Stock Rebalancing">
      <div className="grid gap-3">
        {transfers.length === 0 && <EmptyState title="No transfer suggestions" detail="Backend returned no current stock rebalancing recommendations." />}
        {transfers.map((transfer) => (
          <article key={`${transfer.from}-${transfer.to}`} className="rounded-md border border-[#BFD9DB] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#B87500]">{transfer.impact}</p>
                <h3 className="mt-1 text-lg font-bold">{transfer.medicine}</h3>
                <p className="mt-1 text-sm text-[#557084]">
                  {transfer.from} to {transfer.to} - {transfer.distance}
                </p>
              </div>
              <div className="rounded-md bg-[#E7F7F6] px-4 py-3 text-center">
                <p className="text-xs font-semibold uppercase text-[#0D8F93]">Move</p>
                <p className="text-xl font-bold text-[#092C46]">{transfer.qty}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}
