import { useState } from "react";
import type { Reservation, SessionUser } from "../types";
import { EmptyState, Panel } from "../components/ui";
import { updateReservation } from "../services/api";
import { useI18n } from "../i18n";

export function ReservationsPage({ reservations, onChanged }: { reservations: Reservation[]; user: SessionUser; onChanged: () => void }) {
  const { t, language } = useI18n();
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function update(id: string, status: string) { setBusy(true); try { await updateReservation(id, status); setMessage("Reservation updated"); onChanged(); } catch (error) { setMessage((error as Error).message); } finally { setBusy(false); } }
  return <Panel title="Reservations">
    {reservations.length === 0 && <EmptyState title="No reservations" detail="Reservations you create will appear here." />}
    <div className="grid gap-3">{reservations.map(row => <article key={row.id} className="rounded border bg-white p-4">
      <h3 className="font-bold">{row.medicine} - {row.qty}</h3><p>{row.pharmacyName} - {row.patient}</p><p>{t("Status")}: {t(row.status)}</p><p>{t("Hold expires")}: {new Date(row.eta).toLocaleString(language === "si" ? "si-LK" : "en-LK")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {row.canManage && row.status === "Pending" && <button className="action" disabled={busy} onClick={() => update(row.id, "confirmed")}>{t("Confirm")}</button>}
        {row.canManage && row.status === "Confirmed" && <button className="action" disabled={busy} onClick={() => update(row.id, "completed")}>{t("Complete pickup")}</button>}
        {["Pending", "Confirmed"].includes(row.status) && <button className="secondary" disabled={busy} onClick={() => update(row.id, "cancelled")}>{t("Cancel reservation")}</button>}
      </div>
    </article>)}</div>{message && <p role="status">{t(message)}</p>}
  </Panel>;
}
