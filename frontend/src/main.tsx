import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  Filter,
  Gauge,
  LocateFixed,
  MapPin,
  PackageCheck,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
} from "lucide-react";
import "./styles.css";

type Medicine = {
  id: number;
  name: string;
  generic: string;
  strength: string;
  criticality: "Medium" | "High" | "Emergency";
  prescription: boolean;
};

type Pharmacy = {
  id: number;
  name: string;
  area: string;
  distance: number;
  eta: number;
  stock: number;
  updatedMinutesAgo: number;
  confidence: number;
  rescueScore: number;
  demandRisk: "Low" | "Medium" | "High";
  open: boolean;
};

const medicines: Medicine[] = [
  {
    id: 1,
    name: "Salbutamol Inhaler",
    generic: "Salbutamol",
    strength: "100 mcg",
    criticality: "Emergency",
    prescription: true,
  },
  {
    id: 2,
    name: "Paracetamol",
    generic: "Acetaminophen",
    strength: "500 mg",
    criticality: "Medium",
    prescription: false,
  },
  {
    id: 3,
    name: "Insulin Rapid Acting",
    generic: "Insulin Aspart",
    strength: "100 IU/ml",
    criticality: "High",
    prescription: true,
  },
];

const pharmacies: Pharmacy[] = [
  {
    id: 1,
    name: "City Care Pharmacy",
    area: "Colombo 07",
    distance: 2.5,
    eta: 9,
    stock: 10,
    updatedMinutesAgo: 5,
    confidence: 95,
    rescueScore: 91,
    demandRisk: "Low",
    open: true,
  },
  {
    id: 2,
    name: "Union Med House",
    area: "Bambalapitiya",
    distance: 1.8,
    eta: 11,
    stock: 6,
    updatedMinutesAgo: 18,
    confidence: 82,
    rescueScore: 78,
    demandRisk: "Medium",
    open: true,
  },
  {
    id: 3,
    name: "Nearest Meds",
    area: "Narahenpita",
    distance: 1.0,
    eta: 5,
    stock: 1,
    updatedMinutesAgo: 310,
    confidence: 30,
    rescueScore: 42,
    demandRisk: "High",
    open: true,
  },
];

const stockRows = [
  { medicine: "Salbutamol Inhaler", stock: 10, predicted24h: 14, action: "Request 8 units" },
  { medicine: "Insulin Rapid Acting", stock: 4, predicted24h: 7, action: "Monitor" },
  { medicine: "Paracetamol 500 mg", stock: 48, predicted24h: 22, action: "Surplus 12 units" },
];

function confidenceClass(score: number) {
  if (score >= 85) return "bg-[#E7F1EA] text-[#4F8A64]";
  if (score >= 60) return "bg-[#FFF5DA] text-[#9A6A12]";
  return "bg-[#FBEAEA] text-[#B64E4E]";
}

function App() {
  const [query, setQuery] = useState("Salbutamol");
  const [quantity, setQuantity] = useState(1);
  const [emergencyMode, setEmergencyMode] = useState(true);
  const [selectedMedicineId, setSelectedMedicineId] = useState(1);

  const selectedMedicine = medicines.find((medicine) => medicine.id === selectedMedicineId) ?? medicines[0];

  const filteredMedicines = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return medicines.filter(
      (medicine) =>
        medicine.name.toLowerCase().includes(normalized) ||
        medicine.generic.toLowerCase().includes(normalized),
    );
  }, [query]);

  const rankedPharmacies = useMemo(() => {
    return [...pharmacies].sort((a, b) => b.rescueScore - a.rescueScore);
  }, []);

  return (
    <main className="min-h-screen bg-[#F8FAF7] text-[#26332B]">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-rows-[auto_1fr] px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DDE6DF] pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/logo-transparent.png"
              alt="MediAssure"
              className="h-20 w-20 rounded-md object-contain sm:h-24 sm:w-24"
            />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold">MediAssure AI</h1>
              <p className="text-sm text-[#6F7D73]">Predictive emergency pharmacy access</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              title="Use current location"
              className="grid h-10 w-10 place-items-center rounded-md border border-[#DDE6DF] bg-white text-[#5F7D68]"
            >
              <LocateFixed size={18} />
            </button>
            <button
              title="Alerts"
              className="grid h-10 w-10 place-items-center rounded-md border border-[#DDE6DF] bg-white text-[#5F7D68]"
            >
              <Bell size={18} />
            </button>
            <button className="inline-flex h-10 items-center gap-2 rounded-md bg-[#5F7D68] px-4 text-sm font-semibold text-white">
              <ShieldCheck size={16} />
              Pharmacist
            </button>
          </div>
        </header>

        <div className="grid gap-5 py-5 lg:grid-cols-[360px_1fr_340px]">
          <aside className="space-y-4">
            <section className="rounded-md border border-[#DDE6DF] bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold">Medicine Search</h2>
                <Search size={18} className="text-[#5F7D68]" />
              </div>

              <label className="text-sm font-medium text-[#6F7D73]" htmlFor="medicine-search">
                Medicine or generic name
              </label>
              <div className="mt-2 flex items-center gap-2 rounded-md border border-[#DDE6DF] bg-[#F8FAF7] px-3">
                <Search size={17} className="text-[#5F7D68]" />
                <input
                  id="medicine-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent py-3 outline-none"
                  placeholder="Search medicine"
                />
              </div>

              <div className="mt-3 grid gap-2">
                {filteredMedicines.map((medicine) => (
                  <button
                    key={medicine.id}
                    onClick={() => setSelectedMedicineId(medicine.id)}
                    className={`rounded-md border p-3 text-left ${
                      selectedMedicineId === medicine.id
                        ? "border-[#5F7D68] bg-[#E7F1EA]"
                        : "border-[#DDE6DF] bg-white"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{medicine.name}</span>
                    <span className="mt-1 block text-xs text-[#6F7D73]">
                      {medicine.generic} · {medicine.strength}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-md border border-[#DDE6DF] bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold">Emergency Request</h2>
                <AlertTriangle size={18} className="text-[#C95F5F]" />
              </div>

              <label className="flex items-center justify-between gap-3 rounded-md border border-[#DDE6DF] bg-[#F8FAF7] p-3 text-sm font-medium">
                Emergency mode
                <input
                  type="checkbox"
                  checked={emergencyMode}
                  onChange={(event) => setEmergencyMode(event.target.checked)}
                  className="h-5 w-5 accent-[#C95F5F]"
                />
              </label>

              <label className="mt-4 block text-sm font-medium text-[#6F7D73]" htmlFor="quantity">
                Required quantity: {quantity}
              </label>
              <input
                id="quantity"
                type="range"
                min="1"
                max="6"
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                className="mt-2 w-full accent-[#5F7D68]"
              />

              <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#C95F5F] px-4 py-3 text-sm font-semibold text-white">
                <PackageCheck size={17} />
                Reserve with pharmacist
              </button>
            </section>
          </aside>

          <section className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric icon={<Gauge size={18} />} label="Best confidence" value="95%" />
              <Metric icon={<Clock3 size={18} />} label="Fastest ETA" value="5 min" />
              <Metric icon={<Truck size={18} />} label="Rebalance need" value="8 units" />
            </div>

            <section className="rounded-md border border-[#DDE6DF] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Availability Ranking</h2>
                  <p className="text-sm text-[#6F7D73]">
                    {selectedMedicine.name} · {quantity} unit{quantity > 1 ? "s" : ""}
                    {emergencyMode ? " · emergency mode" : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    title="Filter"
                    className="grid h-10 w-10 place-items-center rounded-md border border-[#DDE6DF] text-[#5F7D68]"
                  >
                    <Filter size={18} />
                  </button>
                  <button
                    title="Ranking controls"
                    className="grid h-10 w-10 place-items-center rounded-md border border-[#DDE6DF] text-[#5F7D68]"
                  >
                    <SlidersHorizontal size={18} />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {rankedPharmacies.map((pharmacy, index) => (
                  <article
                    key={pharmacy.id}
                    className="rounded-md border border-[#DDE6DF] bg-[#FFFFFF] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="grid h-7 w-7 place-items-center rounded-md bg-[#5F7D68] text-sm font-semibold text-white">
                            {index + 1}
                          </span>
                          <h3 className="font-semibold">{pharmacy.name}</h3>
                        </div>
                        <p className="mt-2 flex items-center gap-1 text-sm text-[#6F7D73]">
                          <MapPin size={15} />
                          {pharmacy.area} · {pharmacy.distance} km · {pharmacy.eta} min ETA
                        </p>
                      </div>
                      <span className={`rounded-md px-3 py-1 text-sm font-semibold ${confidenceClass(pharmacy.confidence)}`}>
                        {pharmacy.confidence}% available
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                      <Fact label="Stock" value={`${pharmacy.stock} units`} />
                      <Fact label="Updated" value={`${pharmacy.updatedMinutesAgo} min ago`} />
                      <Fact label="Demand risk" value={pharmacy.demandRisk} />
                      <Fact label="Rescue score" value={`${pharmacy.rescueScore}/100`} />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </section>

          <aside className="space-y-4">
            <section className="rounded-md border border-[#DDE6DF] bg-white p-4">
              <h2 className="text-base font-semibold">Map Preview</h2>
              <div className="mt-4 aspect-square rounded-md border border-[#DDE6DF] bg-[#E7F1EA] p-4">
                <div className="relative h-full rounded-md bg-[#F8FAF7]">
                  <MapDot className="left-[18%] top-[24%]" label="P3" tone="warn" />
                  <MapDot className="left-[58%] top-[34%]" label="P1" tone="good" />
                  <MapDot className="left-[42%] top-[70%]" label="P2" tone="mid" />
                  <div className="absolute left-[30%] top-[48%] h-3 w-3 rounded-full bg-[#26332B] ring-4 ring-white" />
                </div>
              </div>
            </section>

            <section className="rounded-md border border-[#DDE6DF] bg-white p-4">
              <h2 className="text-base font-semibold">Pharmacy Dashboard</h2>
              <div className="mt-4 grid gap-3">
                {stockRows.map((row) => (
                  <div key={row.medicine} className="rounded-md border border-[#DDE6DF] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold">{row.medicine}</p>
                      <CheckCircle2 size={17} className="shrink-0 text-[#4F8A64]" />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <Fact label="Stock" value={String(row.stock)} />
                      <Fact label="24h demand" value={String(row.predicted24h)} />
                    </div>
                    <p className="mt-3 text-xs font-semibold text-[#5F7D68]">{row.action}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#DDE6DF] bg-white p-4">
      <div className="flex items-center gap-2 text-[#5F7D68]">{icon}</div>
      <p className="mt-3 text-xs font-medium uppercase text-[#6F7D73]">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#6F7D73]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function MapDot({
  className,
  label,
  tone,
}: {
  className: string;
  label: string;
  tone: "good" | "mid" | "warn";
}) {
  const toneClass =
    tone === "good" ? "bg-[#4F8A64]" : tone === "mid" ? "bg-[#D9A441]" : "bg-[#C95F5F]";

  return (
    <div className={`absolute ${className}`}>
      <div className={`grid h-9 w-9 place-items-center rounded-full ${toneClass} text-xs font-bold text-white shadow-sm`}>
        {label}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
