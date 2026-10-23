import { useEffect, useState, type FormEvent } from "react";
import { EmptyState, Panel } from "../components/ui";
import type { AuditEvent, SessionUser } from "../types";
import { approveUser, fetchUsers, updateProfile } from "../services/api";
import { ValidatedForm, ValidatedInput } from "../components/ValidatedForm";
import { EmailDeliveryPanel } from "../components/EmailDeliveryPanel";
import { LanguageSwitch, useI18n } from "../i18n";
export function SettingsPage({ auditEvents, user, onProfileSaved }: { auditEvents: AuditEvent[]; user: SessionUser; onProfileSaved: (user: SessionUser) => void }) {
  const { t } = useI18n(); const [users, setUsers] = useState<SessionUser[]>([]); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setProfileBusy(true); setProfileError(""); setProfileMessage("");
    const data = new FormData(event.currentTarget);
    try {
      const saved = await updateProfile({ name: String(data.get("name")).trim(), email: String(data.get("email")).trim(), phone: String(data.get("phone")).trim() });
      onProfileSaved(saved); setProfileMessage("Profile updated successfully");
    } catch (error) { setProfileError(error instanceof Error ? error.message : "Request failed. Please try again."); }
    finally { setProfileBusy(false); }
  }
  useEffect(() => { if (user.role === "Admin") fetchUsers().then(setUsers).catch(error => setError(error.message)); }, [user]);
  return <div className="grid gap-5"><Panel title="Profile details">
    <p className="mb-4">{t("Role")}: {t(user.role)}</p>
    <ValidatedForm key={`${user.id}-${user.name}-${user.email}-${user.phone}`} className="grid gap-4 sm:grid-cols-2" onSubmit={saveProfile} onChange={() => { setProfileError(""); setProfileMessage(""); }}>
      <label className="sm:col-span-2">{t("Full name")}<ValidatedInput className="field" name="name" defaultValue={user.name} minLength={2} maxLength={120} autoComplete="name" disabled={profileBusy} required /></label>
      <label>{t("Email")}<ValidatedInput className="field" name="email" type="email" defaultValue={user.email} maxLength={255} autoComplete="email" disabled={profileBusy} required /></label>
      <label>{t("Phone")}<ValidatedInput className="field" name="phone" type="tel" defaultValue={user.phone ?? ""} maxLength={32} autoComplete="tel" disabled={profileBusy} /></label>
      <p className="text-sm sm:col-span-2">{t("Use your updated email address the next time you sign in.")}</p>
      {profileError && <p className="text-red-700 sm:col-span-2" role="alert">{t(profileError)}</p>}
      {profileMessage && <p className="sm:col-span-2" role="status">{t(profileMessage)}</p>}
      <button className="action sm:col-span-2" disabled={profileBusy}>{t(profileBusy ? "Saving..." : "Save profile")}</button>
    </ValidatedForm>
    <div className="mt-4"><LanguageSwitch /></div>
  </Panel>
    {user.role === "Admin" && <Panel title="Staff account approvals">{error && <p role="alert">{t(error)}</p>}{users.filter(u => !u.approved).length === 0 && <p>{t("No pending approvals")}</p>}{users.filter(u => !u.approved).map(account => <div className="my-2 flex flex-wrap items-center justify-between gap-3 rounded border p-3" key={account.id}><div><p>{account.name} ? {t(account.role)}</p><p>{account.email}</p></div><button className="action" disabled={busy} onClick={async () => { setBusy(true); try { await approveUser(account.id); setUsers(await fetchUsers()); } catch (error) { setError((error as Error).message); } finally { setBusy(false); } }}>{t("Approve")}</button></div>)}</Panel>}
    <EmailDeliveryPanel />
    <Panel title="Audit Trail">{!auditEvents.length && <EmptyState title="No audit events" detail="Saved account and inventory actions appear here." />}{auditEvents.map((event, index) => <article className="mb-3 rounded border bg-white p-3" key={index}><h3>{t(event.action)}</h3><p>{event.target}</p><p>{event.actor} ? {event.time}</p></article>)}</Panel>
  </div>;
}
