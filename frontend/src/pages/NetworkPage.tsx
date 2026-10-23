import { EmptyState, Panel } from "../components/ui";
import type { NetworkPharmacy } from "../types";
import { useI18n } from "../i18n";
export function NetworkPage({ networkPharmacies }: { networkPharmacies: NetworkPharmacy[] }) {
  const { t } = useI18n();
  return <Panel title="Medicine locations">{networkPharmacies.length === 0 && <EmptyState title="No medicine locations yet" detail="Pharmacies and hospitals appear after an approved operator adds inventory." />}<div className="grid gap-3">{networkPharmacies.map((row, index) => <article className="rounded border bg-white p-4" key={index}><p className="text-sm text-[#0D8F93]">{t(row.locationType)}</p><h3 className="font-bold">{row.name}</h3><p>{row.area}</p><p>{t(row.status === "Online" ? "Open" : "Closed")} ? {t(row.openUntil)}</p><p>{t("Stock health")}: {row.stockHealth}% ? {t("Urgent gaps")}: {row.urgentGaps}</p>{row.latitude != null && row.longitude != null && <a className="mt-2 inline-block underline" href={`https://www.openstreetmap.org/?mlat=${row.latitude}&mlon=${row.longitude}#map=16/${row.latitude}/${row.longitude}`} target="_blank" rel="noreferrer">{t("View location")}</a>}</article>)}</div></Panel>;
}
