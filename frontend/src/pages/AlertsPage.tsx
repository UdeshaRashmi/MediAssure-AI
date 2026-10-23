import { EmptyState, Panel } from "../components/ui";
import type { OperationalAlert } from "../types";
export function AlertsPage({ alerts }: { alerts: OperationalAlert[] }) { return <Panel title="Alerts">{alerts.length ? alerts.map((alert, index) => <article key={index}><h3>{alert.title}</h3><p>{alert.detail}</p></article>) : <EmptyState title="No alerts" detail="No low-stock alerts from your current inventory." />}</Panel>; }
