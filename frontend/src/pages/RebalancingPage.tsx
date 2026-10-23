import { useEffect, useState } from "react";
import { EmptyState, LoadingState, Modal, Panel } from "../components/ui";
import { fetchTransfers, fetchTransferHistory, recordTransfer, type CompletedTransfer } from "../services/api";
import type { TransferSuggestion } from "../types";
import { useI18n } from "../i18n";

export function RebalancingPage({ onChanged }: { onChanged: () => void }) {
  const { t, language } = useI18n();
  const [suggestions, setSuggestions] = useState<TransferSuggestion[]>([]);
  const [history, setHistory] = useState<CompletedTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<{ item: TransferSuggestion; key: string } | null>(null);
  useEffect(() => {
    let alive = true;
    Promise.all([fetchTransfers(), fetchTransferHistory()]).then(([items, records]) => {
      if (alive) { setSuggestions(items); setHistory(records); }
    }).catch(error => { if (alive) setError(error.message); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  async function confirm() {
    if (!selected) return;
    setBusy(true); setError("");
    try {
      await recordTransfer({ from_inventory_id: selected.item.from_inventory_id,
        to_inventory_id: selected.item.to_inventory_id, quantity: selected.item.qty, request_key: selected.key });
      setSelected(null); onChanged();
    } catch (error) { setError(error instanceof Error ? error.message : "Request failed. Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="grid gap-5">
    {error && !selected && <p role="alert">{t(error)}</p>}
    <Panel title="Stock transfer suggestions">
      <p className="mb-4 text-sm">{t("Suggestions use available stock after reservations. Donors keep twice their reorder level; matching medicine and strength are required.")}</p>
      {loading && <LoadingState label="Loading data..." />}
      {!loading && !error && !suggestions.length && <EmptyState title="No transfer suggestions" detail="No matching surplus stock is currently available for low-stock institutions." />}
      <div className="grid gap-3">{suggestions.map(item => <article className="min-w-0 rounded border bg-white p-4" key={item.from_inventory_id + "-" + item.to_inventory_id}>
        <h3 className="font-bold">{item.medicine}</h3><p className="mt-2">{item.from} → {item.to}</p>
        <p>{t("Quantity")}: {item.qty}</p>
        <p>{t("Distance")}: {item.distance_km === null ? t("Location unavailable") : item.distance_km + " km"}</p>
        {item.can_execute ? <button className="action mt-3" onClick={() => { setError(""); setSelected({ item, key: crypto.randomUUID() }); }}>{t("Record completed transfer")}</button> :
          <p className="mt-3 text-sm">{t("The supplying institution must record the completed transfer.")}</p>}
      </article>)}</div>
    </Panel>
    <Panel title="Transfer history">
      {!history.length && <p>{t("No completed transfers")}</p>}
      <div className="grid gap-3">{history.map(row => <article className="rounded border bg-white p-4" key={row.id}>
        <h3 className="font-bold">#{row.id} · {row.medicine}</h3><p>{row.from} → {row.to}</p>
        <p>{t("Quantity")}: {row.qty} · {t(row.status)}</p><p className="text-sm">{new Date(row.created_at).toLocaleString(language === "si" ? "si-LK" : "en-LK")}</p>
      </article>)}</div>
    </Panel>
    <Modal title="Confirm completed transfer" open={Boolean(selected)} onClose={() => { if (!busy) { setSelected(null); setError(""); } }}>
      <p className="mb-3 font-bold">{selected?.item.medicine}</p>
      <p>{selected?.item.from} → {selected?.item.to} · {t("Quantity")}: {selected?.item.qty}</p>
      <p className="my-4">{t("Confirm only after the physical handover is complete. This deducts donor stock and adds recipient stock immediately.")}</p>
      {error && <p className="mb-3 text-red-700" role="alert">{t(error)}</p>}
      <button className="action" disabled={busy} onClick={confirm}>{t(busy ? "Saving..." : "Confirm completed transfer")}</button>
    </Modal>
  </div>;
}
