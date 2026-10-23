import { useState } from "react";
import type { PharmacyMatch } from "../types";
import { EmptyState, LoadingState, Panel } from "../components/ui";
import { createReservation } from "../services/api";
import { useI18n } from "../i18n";

export function FinderPage({ matches, loading, quantity, onChanged }: { matches: PharmacyMatch[]; loading: boolean; quantity: number; onChanged: () => void }) {
  const { t } = useI18n();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return <Panel title="Medicine Finder">
    <p className="mb-4 text-sm">{t("Enter a medicine and your location above. Distance and travel time are estimates; contact the pharmacy to confirm availability.")}</p>
    {loading && <LoadingState label="Searching..." />}
    {!loading && matches.length === 0 && <EmptyState title="No matching pharmacies" detail="Check the medicine name, requested quantity, and whether the pharmacy is open." />}
    <div className="grid gap-3">{matches.map(match => <article key={match.inventoryId} className="rounded border bg-white p-4">
      <h3 className="font-bold">{match.name}</h3><p>{match.area}</p><p>{match.medicine} ? {match.distance} ? {t("Estimated travel time")}: {match.eta}</p>
      <p>{t("Available stock")}: {match.stock}</p><div className="mt-3 flex flex-wrap gap-3">
        <button className="action" disabled={busy} onClick={async () => { setBusy(true); setMessage(""); try { await createReservation(match.inventoryId, quantity); setMessage("Reservation saved. Awaiting pharmacy confirmation."); onChanged(); } catch (error) { setMessage((error as Error).message); } finally { setBusy(false); } }}>{t("Reserve medicine")}</button>
        <a className="secondary" href={`tel:${match.phone}`}>{t("Call Pharmacy")}: {match.phone}</a>
      </div>
    </article>)}</div>{message && <p className="mt-4" role="status">{t(message)}</p>}
  </Panel>;
}
