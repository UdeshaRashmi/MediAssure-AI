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
          <div className="overflow-hidden rounded-md border border-[#BFD9DB] bg-white">
            <iframe
              className="h-[360px] w-full border-0"
              title="Colombo pharmacy coverage map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=79.842%2C6.900%2C79.890%2C6.950&layer=mapnik&marker=6.9271%2C79.8612"
            />
            <div className="border-t border-[#D8E8E8] p-4">
              <p className="text-sm font-bold">Nearest reliable coverage</p>
              <p className="mt-1 text-sm text-[#557084]">4.8 km city radius with one delayed inventory feed.</p>
              <div className="mt-3 grid gap-2">
                <MapMarker label="City Care" tone="teal" />
                <MapMarker label="WellCare" tone="teal" />
                <MapMarker label="Union Med" tone="amber" />
                <MapMarker label="Central" tone="teal" />
              </div>
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
}

function MapMarker({ label, tone }: { label: string; tone: "teal" | "amber" }) {
  const color = tone === "teal" ? "bg-[#0D8F93]" : "bg-[#F5A623]";
  return (
    <div className="flex items-center gap-2">
      <div className={`h-3 w-3 rounded-full ${color}`} />
      <p className="text-xs font-bold text-[#092C46]">{label}</p>
    </div>
  );
}
