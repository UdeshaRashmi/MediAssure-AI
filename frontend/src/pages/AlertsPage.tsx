import { useEffect, useState } from "react";
import { emailMyAlerts, fetchAlerts } from "../services/api";
import type { OperationalAlert } from "../types";
import { EmptyState, LoadingState, Panel } from "../components/ui";
import { EmailDeliveryPanel } from "../components/EmailDeliveryPanel";
import { useI18n } from "../i18n";

export function AlertsPage({ initialAlerts }: { initialAlerts: OperationalAlert[] }) {
  const { t } = useI18n();
  const [alerts, setAlerts] = useState(initialAlerts);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let alive = true;
    const timer = setInterval(() => { fetchAlerts().then(value => { if (alive) { setAlerts(value); setError(""); } }).catch(error => { if (alive) setError(error.message); }); }, 30000);
    return () => { alive = false; clearInterval(timer); };
  }, []);
  async function email() {
    setBusy(true); setError(""); setMessage("");
    try { const result = await emailMyAlerts(); setMessage(result.queued ? "Low-stock email notifications queued. Repeated requests do not send duplicates today." : "No new emails queued. Today's alerts may already be queued, or you have no low stock."); setRevision(value => value + 1); }
    catch (error) { setError(error instanceof Error ? error.message : "Request failed. Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="grid gap-5">
    <Panel title="Stock alerts" action={<button className="secondary" disabled={busy || !alerts.length} onClick={email}>{t("Email my alerts")}</button>}>
      {busy && <LoadingState label="Please wait..." />}
      {error && <p role="alert">{t(error)}</p>}{message && <p role="status">{t(message)}</p>}
      {!alerts.length && <EmptyState title="No alerts" detail="No low-stock alerts from your current inventory." />}
      <div className="grid gap-3">{alerts.map((alert, index) => <article className={"rounded border bg-white p-4 " + (alert.tone === "danger" ? "border-red-300" : "border-amber-300")} key={alert.inventory_id ?? index}>
        <h3 className="font-bold">{alert.title}</h3>
        {alert.pharmacy ? <><p>{alert.pharmacy}</p><p>{t("Available stock")}: {alert.available}</p><p>{t("Reserved units")}: {alert.reserved}</p><p>{t("Reorder level")}: {alert.reorder_level}</p></> : <p>{alert.detail}</p>}
      </article>)}</div>
    </Panel>
    <EmailDeliveryPanel revision={revision} />
  </div>;
}
