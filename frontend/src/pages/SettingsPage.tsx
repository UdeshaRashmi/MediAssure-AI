import type { ReactNode } from "react";
import { BellRing, Database, KeyRound, ShieldAlert, SlidersHorizontal, UserRound } from "lucide-react";
import { EmptyState, Panel, StatusBadge } from "../components/ui";
import type { AuditEvent, SessionUser } from "../types";

export function SettingsPage({ auditEvents, user }: { auditEvents: AuditEvent[]; user: SessionUser }) {
  return (
    <div className="grid gap-5">
      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Account and Role">
          <div className="rounded-md border border-[#BFD9DB] bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-[#E7F7F6] text-[#0D8F93]">
                <UserRound size={22} />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold">{user.name}</h3>
                <p className="mt-1 truncate text-sm text-[#557084]">{user.email}</p>
                <div className="mt-3">
                  <StatusBadge label={user.role} tone="teal" />
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Safety and Automation Controls">
          <div className="grid gap-3 md:grid-cols-2">
            <ControlCard
              icon={<ShieldAlert size={19} />}
              title="Prescription guard"
              detail="Require pharmacist approval before showing prescription alternatives."
              enabled
            />
            <ControlCard
              icon={<SlidersHorizontal size={19} />}
              title="Auto transfer review"
              detail="Create review tasks when stock-out risk exceeds the configured threshold."
              enabled
            />
            <ControlCard
              icon={<BellRing size={19} />}
              title="Emergency notifications"
              detail="Notify operators when reservation pickup windows are close to expiry."
              enabled
            />
            <ControlCard
              icon={<Database size={19} />}
              title="Backend required"
              detail="Use FastAPI as the only data source for authenticated workspaces."
              enabled
            />
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Panel title="Audit Trail">
          <div className="grid gap-3">
            {auditEvents.length === 0 && <EmptyState title="No audit events" detail="Backend returned no recent audit records." />}
            {auditEvents.map((event) => (
              <article key={`${event.actor}-${event.time}`} className="rounded-md border border-[#BFD9DB] bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#092C46]">{event.action}</p>
                    <p className="mt-1 text-sm text-[#557084]">{event.target}</p>
                  </div>
                  <StatusBadge label={event.time} tone={event.tone} />
                </div>
                <p className="mt-3 text-xs font-bold uppercase text-[#557084]">Actor: {event.actor}</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="API Environment">
          <div className="grid gap-3">
            <InfoRow icon={<KeyRound size={17} />} label="Auth mode" value="Demo bearer token" />
            <InfoRow icon={<Database size={17} />} label="Base URL" value={import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8001"} />
            <InfoRow icon={<BellRing size={17} />} label="Alerts" value="SNS-ready prototype" />
          </div>
        </Panel>
      </section>
    </div>
  );
}

function ControlCard({ icon, title, detail, enabled }: { icon: ReactNode; title: string; detail: string; enabled: boolean }) {
  return (
    <article className="rounded-md border border-[#BFD9DB] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#E9F0F5] text-[#092C46]">{icon}</div>
        <button
          className={`h-6 w-11 rounded-full p-1 ${enabled ? "bg-[#0D8F93]" : "bg-[#BFD9DB]"}`}
          title={enabled ? "Enabled" : "Disabled"}
        >
          <span className={`block h-4 w-4 rounded-full bg-white ${enabled ? "ml-5" : ""}`} />
        </button>
      </div>
      <h3 className="mt-4 font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#557084]">{detail}</p>
    </article>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-[#BFD9DB] bg-white p-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#E7F7F6] text-[#0D8F93]">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase text-[#557084]">{label}</p>
        <p className="truncate text-sm font-bold text-[#092C46]">{value}</p>
      </div>
    </div>
  );
}
