import { useMemo, useState } from "react";
import { Cloud, MapPin, RadioTower, RotateCw, WifiOff } from "lucide-react";
import { EmptyState, Metric, Panel, ProgressBar, StatusBadge } from "../components/ui";
import type { NetworkPharmacy } from "../types";

export function NetworkPage({ networkPharmacies }: { networkPharmacies: NetworkPharmacy[] }) {
  const [selectedName, setSelectedName] = useState(networkPharmacies[0]?.name ?? "");
  const [syncMessage, setSyncMessage] = useState("");
  const online = networkPharmacies.filter((pharmacy) => pharmacy.status === "Online").length;
  const gaps = networkPharmacies.reduce((sum, pharmacy) => sum + pharmacy.urgentGaps, 0);
  const averageHealth = networkPharmacies.length
    ? Math.round(networkPharmacies.reduce((sum, pharmacy) => sum + pharmacy.stockHealth, 0) / networkPharmacies.length)
    : 0;
  const selectedPharmacy = networkPharmacies.find((pharmacy) => pharmacy.name === selectedName) ?? networkPharmacies[0];

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
            <button
              type="button"
              onClick={() => setSyncMessage(`Sync requested for ${networkPharmacies.length} partner pharmacies.`)}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-[#BFD9DB] bg-white px-3 text-sm font-bold text-[#31556A]"
            >
              <RotateCw size={16} />
              Sync now
            </button>
          }
        >
          <div className="grid gap-3">
            {syncMessage && <div className="rounded-md border border-[#BFD9DB] bg-white p-4 text-sm font-bold text-[#0D8F93]">{syncMessage}</div>}
            {networkPharmacies.length === 0 && <EmptyState title="No pharmacy network data" detail="Backend returned no partner pharmacy records." />}
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
                  <div className="mt-2">
                    <ProgressBar value={pharmacy.stockHealth} dangerAt={95} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Operational Coverage Map">
          {networkPharmacies.length === 0 ? (
            <EmptyState title="No map data" detail="Backend returned no pharmacy coordinates." />
          ) : (
            <OperationalMap
              pharmacies={networkPharmacies}
              selectedPharmacy={selectedPharmacy}
              onSelect={setSelectedName}
            />
          )}
        </Panel>
      </section>
    </div>
  );
}

function OperationalMap({
  pharmacies,
  selectedPharmacy,
  onSelect,
}: {
  pharmacies: NetworkPharmacy[];
  selectedPharmacy?: NetworkPharmacy;
  onSelect: (name: string) => void;
}) {
  const bounds = useMemo(() => {
    const latitudes = pharmacies.map((pharmacy) => pharmacy.latitude);
    const longitudes = pharmacies.map((pharmacy) => pharmacy.longitude);
    return {
      maxLat: Math.max(...latitudes),
      maxLng: Math.max(...longitudes),
      minLat: Math.min(...latitudes),
      minLng: Math.min(...longitudes),
    };
  }, [pharmacies]);

  return (
    <div className="overflow-hidden rounded-md border border-[#BFD9DB] bg-white">
      <div className="relative h-[420px] bg-[#EDF7F6]">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,44,70,0.08)_1px,transparent_1px),linear-gradient(rgba(9,44,70,0.08)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="absolute left-5 right-5 top-[30%] h-2 -rotate-6 rounded-full bg-white shadow-sm" />
        <div className="absolute bottom-[24%] left-8 right-8 h-2 rotate-3 rounded-full bg-white shadow-sm" />
        <div className="absolute bottom-8 top-8 left-[48%] w-2 rounded-full bg-white shadow-sm" />
        <div className="absolute left-4 top-4 rounded-md bg-white/95 px-3 py-2 shadow-sm">
          <p className="text-xs font-bold uppercase text-[#557084]">Colombo coverage</p>
          <p className="text-sm font-bold text-[#092C46]">{pharmacies.length} partner pharmacies</p>
        </div>

        {pharmacies.map((pharmacy) => {
          const position = getMapPosition(pharmacy, bounds);
          const selected = selectedPharmacy?.name === pharmacy.name;
          const coverageSize = 72 + Math.round(pharmacy.stockHealth / 3);

          return (
            <button
              key={pharmacy.name}
              type="button"
              title={`${pharmacy.name} - ${pharmacy.status}`}
              onClick={() => onSelect(pharmacy.name)}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
            >
              <span
                className={`absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 rounded-full border ${
                  selected ? "border-[#092C46] bg-[#0D8F93]/15" : "border-[#0D8F93]/30 bg-[#0D8F93]/10"
                }`}
                style={{ height: coverageSize, width: coverageSize }}
              />
              <span className={`relative grid h-12 w-12 place-items-center rounded-full text-sm font-bold text-white shadow-md ${markerClass(pharmacy.status)}`}>
                {pharmacy.urgentGaps}
              </span>
              <span className="relative mt-2 block max-w-[120px] rounded-md bg-white px-2 py-1 text-xs font-bold text-[#092C46] shadow-sm">
                {pharmacy.area}
              </span>
            </button>
          );
        })}
      </div>

      <div className="border-t border-[#D8E8E8] p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <LegendItem color="bg-[#0D8F93]" label="Online sync" />
          <LegendItem color="bg-[#F5A623]" label="Delayed sync" />
          <LegendItem color="bg-[#C94D57]" label="Offline sync" />
        </div>
        <p className="mt-3 text-xs font-semibold uppercase text-[#557084]">Marker number shows urgent medicine gaps. Circle size shows stock coverage strength.</p>
        {selectedPharmacy && (
          <div className="mt-4 rounded-md border border-[#BFD9DB] bg-[#F8FCFC] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-bold">{selectedPharmacy.name}</h3>
                <p className="mt-1 text-sm text-[#557084]">
                  {selectedPharmacy.area} - open until {selectedPharmacy.openUntil} - synced {selectedPharmacy.lastSync}
                </p>
              </div>
              <StatusBadge label={selectedPharmacy.status} tone={selectedPharmacy.status === "Online" ? "teal" : "amber"} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-md bg-white p-3">
                <p className="text-xs font-bold uppercase text-[#557084]">Urgent gaps</p>
                <p className="mt-1 text-2xl font-bold text-[#092C46]">{selectedPharmacy.urgentGaps}</p>
              </div>
              <div className="rounded-md bg-white p-3">
                <p className="text-xs font-bold uppercase text-[#557084]">Stock health</p>
                <p className="mt-1 text-2xl font-bold text-[#0D8F93]">{selectedPharmacy.stockHealth}%</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getMapPosition(
  pharmacy: NetworkPharmacy,
  bounds: { maxLat: number; maxLng: number; minLat: number; minLng: number },
) {
  const latRange = bounds.maxLat - bounds.minLat || 1;
  const lngRange = bounds.maxLng - bounds.minLng || 1;

  return {
    x: 14 + ((pharmacy.longitude - bounds.minLng) / lngRange) * 72,
    y: 14 + ((bounds.maxLat - pharmacy.latitude) / latRange) * 72,
  };
}

function markerClass(status: NetworkPharmacy["status"]) {
  if (status === "Offline") return "bg-[#C94D57]";
  if (status === "Delayed") return "bg-[#F5A623]";
  return "bg-[#0D8F93]";
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span className="text-xs font-bold text-[#31556A]">{label}</span>
    </div>
  );
}
