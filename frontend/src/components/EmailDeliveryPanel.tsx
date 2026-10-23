import { useEffect, useState } from "react";
import { fetchEmailDelivery, retryEmail, type EmailDelivery } from "../services/api";
import { Panel } from "./ui";
import { useI18n } from "../i18n";

export function EmailDeliveryPanel({ revision = 0 }: { revision?: number }) {
  const { t, language } = useI18n();
  const [delivery, setDelivery] = useState<EmailDelivery | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let alive = true;
    const load = () => fetchEmailDelivery().then(value => { if (alive) { setDelivery(value); setError(""); } }).catch(error => { if (alive) setError(error.message); });
    void load();
    const timer = setInterval(load, 30000);
    return () => { alive = false; clearInterval(timer); };
  }, [revision, reload]);
  return <Panel title="Email delivery">
    {error && <p role="alert">{t(error)}</p>}
    {delivery?.transport === "disabled" && <p className="mb-3">{t("Email delivery is not configured. Messages remain queued until an administrator enables email delivery.")}</p>}
    {delivery?.transport === "file" && <p className="mb-3">{t("Preview mode: emails are saved locally and are not delivered to inboxes.")}</p>}
    {delivery && !delivery.messages.length && <p>{t("No email notifications")}</p>}
    <div className="grid gap-3">{delivery?.messages.map(row => <article className="min-w-0 rounded border bg-white p-3" key={row.id}>
      <p className="font-bold">{row.subject}</p><p>{t("Delivery status")}: {t(({ pending: "Queued", sent: "Sent to mail server", preview: "Preview saved", failed: "Delivery failed", skipped: "Skipped" } as Record<string, string>)[row.status] ?? row.status)}</p>
      <p className="text-sm">{new Date(row.created_at).toLocaleString(language === "si" ? "si-LK" : "en-LK")}</p>
      {row.last_error && <p className="text-sm text-red-700">{t(row.last_error)}</p>}
      {row.status === "failed" && <button className="secondary mt-2" disabled={busy} onClick={async () => {
        setBusy(true); setError("");
        try { await retryEmail(row.id); setReload(value => value + 1); }
        catch (error) { setError(error instanceof Error ? error.message : "Request failed. Please try again."); }
        finally { setBusy(false); }
      }}>{t("Retry email")}</button>}
    </article>)}</div>
  </Panel>;
}
