import { useEffect, useState } from "react";
import { EmptyState, Panel } from "../components/ui";
import type { AuditEvent, SessionUser } from "../types";
import { approveUser, fetchUsers } from "../services/api";
import { LanguageSwitch, useI18n } from "../i18n";
export function SettingsPage({ auditEvents, user }: { auditEvents: AuditEvent[]; user: SessionUser }) {
  const { t } = useI18n(); const [users, setUsers] = useState<SessionUser[]>([]); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { if (user.role === "Admin") fetchUsers().then(setUsers).catch(error => setError(error.message)); }, [user]);
  return <div className="grid gap-5"><Panel title="Account and Role"><p>{user.name}</p><p>{user.email}</p><p>{t(user.role)}</p><div className="mt-4"><LanguageSwitch /></div></Panel>
    {user.role === "Admin" && <Panel title="Staff account approvals">{error && <p role="alert">{t(error)}</p>}{users.filter(u => !u.approved).length === 0 && <p>{t("No pending approvals")}</p>}{users.filter(u => !u.approved).map(account => <div className="my-2 flex flex-wrap items-center justify-between gap-3 rounded border p-3" key={account.id}><div><p>{account.name} ? {t(account.role)}</p><p>{account.email}</p></div><button className="action" disabled={busy} onClick={async () => { setBusy(true); try { await approveUser(account.id); setUsers(await fetchUsers()); } catch (error) { setError((error as Error).message); } finally { setBusy(false); } }}>{t("Approve")}</button></div>)}</Panel>}
    <Panel title="Audit Trail">{!auditEvents.length && <EmptyState title="No audit events" detail="Saved account and inventory actions appear here." />}{auditEvents.map((event, index) => <article className="mb-3 rounded border bg-white p-3" key={index}><h3>{t(event.action)}</h3><p>{event.target}</p><p>{event.actor} ? {event.time}</p></article>)}</Panel>
  </div>;
}
