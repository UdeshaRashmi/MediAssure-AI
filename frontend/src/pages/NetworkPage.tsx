import { Cloud, MapPin, RadioTower, RotateCw, WifiOff } from "lucide-react";
import { networkPharmacies } from "../data/mockData";
import { Metric, Panel, StatusBadge } from "../components/ui";

export function NetworkPage() {
  const online = networkPharmacies.filter((pharmacy) => pharmacy.status === "Online").length;
  const gaps = networkPharmacies.reduce((sum, pharmacy) => sum + pharmacy.urgentGaps, 0);
  const averageHealth = Math.round(
    networkPharmacies.reduce((sum, pharmacy) => sum + pharmacy.stockHealth, 0) / networkPharmacies.length,
  );

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<RadioTower size={20} />} label="Online pharmacies" value={`${online}/${networkPharmacies.length}`} tone="teal" />
        <Metric icon={<WifiOff size={20} />} label="Sync delays" value="1" tone="amber" />
        <Metric icon={<MapPin size={20} />} label="Urgent gaps" value={gaps.toString()} tone="danger" />
        <Metric icon={<Cloud size={20} />} label="Stock health" value={`${averageHealth}%`} tone="navy" />
      </div>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Panel
          title="Partner Pharmacy Network"
          action={
            <button className="inline-flex h-10 items-center gap-2 rounded-md border border-[#BFD9DB] bg-white px-3 text-sm font-bold text-[#31556A]">
              <RotateCw size={16} />
              Sync now
            </button>
          }
        >
          <div className="grid gap-3">
            {networkPharmacies.map((pharmacy) => (
              <article key={pharmacy.name} className="rounded-md border border-[#BFD9DB] bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold">{pharmacy.name}</h3>
                      <StatusBadge label={pharmacy.status} tone={pharmacy.status === "Online" ? "teal" : "amber"} />
                    </div>
                    <p className="mt-1 text-sm text-[#557084]">
                      {pharmacy.area} - open until {pharmacy.openUntil} - synced {pharmacy.lastSync}
                    </p>
                  </div>
                  <div className="rounded-md bg-[#F8FCFC] px-4 py-3 text-center">
                    <p className="text-xs font-bold uppercase text-[#557084]">Gaps</p>
                    <p className="text-xl font-bold text-[#092C46]">{pharmacy.urgentGaps}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase text-[#557084]">Stock health</p>
                    <p className="text-sm font-bold text-[#092C46]">{pharmacy.stockHealth}%</p>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[#D8E8E8]">
                    <div className="h-2 rounded-full bg-[#0D8F93]" style={{ width: `${pharmacy.stockHealth}%` }} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Coverage Map">
          <div className="relative min-h-[380px] overflow-hidden rounded-md border border-[#BFD9DB] bg-[#E7F7F6]">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,44,70,0.08)_1px,transparent_1px),linear-gradient(rgba(9,44,70,0.08)_1px,transparent_1px)] bg-[size:42px_42px]" />
            <MapMarker className="left-[18%] top-[24%]" label="City Care" tone="teal" />
            <MapMarker className="left-[52%] top-[30%]" label="WellCare" tone="teal" />
            <MapMarker className="left-[38%] top-[62%]" label="Union Med" tone="amber" />
            <MapMarker className="left-[70%] top-[56%]" label="Central" tone="teal" />
            <div className="absolute bottom-4 left-4 right-4 rounded-md bg-white/95 p-3 shadow-sm">
              <p className="text-sm font-bold">Nearest reliable coverage</p>
              <p className="mt-1 text-sm text-[#557084]">4.8 km city radius with one delayed inventory feed.</p>
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
}

function MapMarker({ className, label, tone }: { className: string; label: string; tone: "teal" | "amber" }) {
  const color = tone === "teal" ? "bg-[#0D8F93]" : "bg-[#F5A623]";
  return (
    <div className={`absolute ${className}`}>
      <div className={`h-4 w-4 rounded-full ${color} ring-4 ring-white`} />
      <p className="mt-2 rounded-md bg-white px-2 py-1 text-xs font-bold text-[#092C46] shadow-sm">{label}</p>
    </div>
  );
}
