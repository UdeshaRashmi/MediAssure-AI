import type { OperationalAlert } from "../types";
import { EmptyState, Panel } from "../components/ui";

export function AlertsPage({ alerts }: { alerts: OperationalAlert[] }) {
  return (
    <Panel title="Operational Alerts">
      <div className="grid gap-3">
        {alerts.length === 0 && <EmptyState title="No alerts" detail="Backend returned no active operational alerts." />}
        {alerts.map((alert) => (
          <article key={alert.title} className="flex gap-3 rounded-md border border-[#BFD9DB] bg-white p-4">
            <div className={`mt-1 h-3 w-3 rounded-full ${dotClass(alert.tone)}`} />
            <div>
              <h3 className="font-bold">{alert.title}</h3>
              <p className="mt-1 text-sm text-[#557084]">{alert.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function dotClass(tone: string) {
  if (tone === "danger") return "bg-[#C94D57]";
  if (tone === "amber") return "bg-[#F5A623]";
  return "bg-[#0D8F93]";
}
