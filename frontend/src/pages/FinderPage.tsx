import { useState } from "react";
import type { PharmacyMatch } from "../types";
import { EmptyState, LoadingState, Panel } from "../components/ui";
import { createReservation } from "../services/api";
import { useI18n } from "../i18n";

export function FinderPage({ hasSearched, matches, loading, quantity, onChanged }: { hasSearched: boolean; matches: PharmacyMatch[]; loading: boolean; quantity: number; onChanged: () => void }) {
  const { t, language } = useI18n();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return <Panel title="Medicine Finder">
    <p className="mb-4 text-sm">{t("Search pharmacy and hospital stock using your location. Contact the institution to confirm pickup arrangements.")}</p>
    {loading && <LoadingState label="Searching..." />}
    {!loading && !hasSearched && <EmptyState title="Ready to search" detail="Enter or edit the medicine, quantity, and location, then select Search pharmacies." />}
    {!loading && hasSearched && matches.length === 0 && <EmptyState title="No matching medicine locations" detail="Check the medicine name, quantity, and whether the institution is open." />}
    <div className="grid gap-3">{matches.map(match => <article key={match.inventoryId} className="rounded border bg-white p-4">
      <p className="text-sm font-bold text-[#0D8F93]">{t(match.locationType)}</p><h3 className="font-bold">{match.name}</h3><p>{match.area}</p><p>{match.medicine} - {match.distance} - {t("Estimated travel time")}: {match.eta}</p>
      <p>{t("Available stock")}: {match.stock}</p><p className="text-sm">{t("Stock updated")}: {new Date(match.updatedAt).toLocaleString(language === "si" ? "si-LK" : "en-LK")}</p><div className="mt-3 flex flex-wrap gap-3">
        <button className="action" disabled={busy} onClick={async () => { setBusy(true); setMessage(""); try { await createReservation(match.inventoryId, quantity); setMessage("Reservation saved. Awaiting pharmacy confirmation."); onChanged(); } catch (error) { setMessage((error as Error).message); } finally { setBusy(false); } }}>{t("Reserve medicine")}</button>
        <a className="secondary" href={`tel:${match.phone}`}>{t("Contact location")}: {match.phone}</a>
        <a className="secondary" href={`https://www.openstreetmap.org/?mlat=${match.latitude}&mlon=${match.longitude}#map=17/${match.latitude}/${match.longitude}`} target="_blank" rel="noreferrer">{t("View location")}</a>
      </div>
    </article>)}</div>{message && <p className="mt-4" role="status">{t(message)}</p>}
  </Panel>;
}
