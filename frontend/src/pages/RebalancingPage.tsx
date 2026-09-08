import { useState } from "react";
import type { TransferSuggestion } from "../types";
import { EmptyState, Modal, Panel } from "../components/ui";

export function RebalancingPage({ transfers }: { transfers: TransferSuggestion[] }) {
  const [selectedTransfer, setSelectedTransfer] = useState<TransferSuggestion | null>(null);
  const [notice, setNotice] = useState("");

  return (
    <>
      <Panel title="Stock Rebalancing">
        <div className="grid gap-3">
          {notice && <div className="rounded-md border border-[#BFD9DB] bg-white p-4 text-sm font-bold text-[#0D8F93]">{notice}</div>}
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
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTransfer(transfer)}
                  className="h-10 rounded-md bg-[#092C46] px-4 text-sm font-bold text-white"
                >
                  Review transfer
                </button>
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <Modal title="Review Transfer" open={Boolean(selectedTransfer)} onClose={() => setSelectedTransfer(null)}>
        {selectedTransfer && (
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              setNotice(`${selectedTransfer.qty} units of ${selectedTransfer.medicine} transfer prepared for approval.`);
              setSelectedTransfer(null);
            }}
          >
            <div className="rounded-md border border-[#BFD9DB] bg-[#F8FCFC] p-4">
              <h3 className="font-bold">{selectedTransfer.medicine}</h3>
              <p className="mt-1 text-sm text-[#557084]">
                {selectedTransfer.from} to {selectedTransfer.to} - {selectedTransfer.distance}
              </p>
            </div>
            <label className="block">
              <span className="text-xs font-bold uppercase text-[#557084]">Approved quantity</span>
              <input
                type="number"
                min={1}
                max={selectedTransfer.qty}
                defaultValue={selectedTransfer.qty}
                className="mt-2 w-full rounded-md border border-[#BFD9DB] bg-[#F8FCFC] px-3 py-3 outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase text-[#557084]">Dispatch note</span>
              <textarea className="mt-2 min-h-24 w-full rounded-md border border-[#BFD9DB] bg-[#F8FCFC] px-3 py-3 outline-none" defaultValue="Approve transfer after source pharmacy stock confirmation." />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setSelectedTransfer(null)} className="h-10 rounded-md border border-[#BFD9DB] px-4 text-sm font-bold text-[#31556A]">
                Cancel
              </button>
              <button className="h-10 rounded-md bg-[#0D8F93] px-4 text-sm font-bold text-white">Approve transfer</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
