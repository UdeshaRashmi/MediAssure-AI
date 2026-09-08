import { useState } from "react";
import { CheckCircle2, Clock, Filter, MapPin, Navigation, PhoneCall, Pill, ShieldCheck } from "lucide-react";
import type { PharmacyMatch } from "../types";
import { Chip, EmptyState, LoadingState, MiniMetric, Modal, Panel, SafetyItem, Score, StatusBadge } from "../components/ui";

export function FinderPage({
  matches,
  matchesLoading,
  matchSource,
  query,
  reservedPharmacy,
  onReserve,
}: {
  matches: PharmacyMatch[];
  matchesLoading: boolean;
  matchSource: "api" | "mock";
  query: string;
  reservedPharmacy: string | null;
  onReserve: (name: string) => void;
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<{ type: "reserve" | "call"; match: PharmacyMatch } | null>(null);
  const [notice, setNotice] = useState("");

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 rounded-lg border border-[#BFD9DB] bg-white p-4 shadow-sm xl:grid-cols-[1fr_320px]">
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#E7F7F6] text-[#0D8F93]">
            <Pill size={23} />
          </div>
          <h2 className="mt-4 text-2xl font-bold">Emergency Medicine Finder</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#557084]">
            Search a medicine and compare pharmacies by verified stock, travel time, availability confidence,
            and emergency rescue score.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip icon={<Navigation size={15} />} label="Nearest reliable pharmacy" />
            <Chip icon={<ShieldCheck size={15} />} label="Pharmacist verified stock" />
            <Chip icon={<Clock size={15} />} label="Arrival-aware matching" />
          </div>
        </div>
        <div className="rounded-md border border-[#D8E8E8] bg-[#F8FCFC] p-4">
          <p className="text-sm font-bold text-[#092C46]">Search status</p>
          <p className="mt-2 text-sm text-[#557084]">
            {query.trim() ? `Showing matches for "${query.trim()}".` : "Showing the most urgent available medicine matches."}
          </p>
          <div className="mt-3">
            <StatusBadge label={matchSource === "api" ? "Live backend results" : "Backend unavailable"} tone={matchSource === "api" ? "teal" : "amber"} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniMetric label="Matches" value={matches.length.toString()} />
            <MiniMetric label="Best score" value={matches[0] ? `${matches[0].rescueScore}%` : "0%"} />
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel
          title="Recommended Pharmacies"
          action={
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-[#BFD9DB] bg-white px-3 text-sm font-bold text-[#31556A]"
            >
              <Filter size={16} />
              Filter
            </button>
          }
        >
          <div className="grid gap-3">
            {matchesLoading && <LoadingState label="Refreshing pharmacy recommendations" />}
            {matches.map((match) => (
              <PharmacyCard
                key={match.name}
                match={match}
                reserved={reservedPharmacy === match.name}
                onCall={() => setActiveDialog({ type: "call", match })}
                onReserve={() => setActiveDialog({ type: "reserve", match })}
              />
            ))}
            {matches.length === 0 && (
              <EmptyState title="No pharmacy matches found" detail="Try a generic name, nearby area, or another medicine category." />
            )}
          </div>
        </Panel>
        <Panel title="Safety Boundary">
          <div className="grid gap-3">
            <SafetyItem title="No automatic substitutions" detail="Alternatives must be pharmacist or doctor verified before display." />
            <SafetyItem title="Reservation first, payment later" detail="Emergency users reserve availability without the app prescribing treatment." />
            <SafetyItem title="Confidence is not medical advice" detail="Scores describe stock reliability and arrival risk, not clinical suitability." />
          </div>
        </Panel>
      </div>

      {notice && <div className="rounded-md border border-[#BFD9DB] bg-white p-4 text-sm font-bold text-[#0D8F93]">{notice}</div>}

      <Modal title="Filter Pharmacies" open={filterOpen} onClose={() => setFilterOpen(false)}>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setNotice("Filter preferences applied for this search view.");
            setFilterOpen(false);
          }}
        >
          <label className="block">
            <span className="text-xs font-bold uppercase text-[#557084]">Minimum rescue score</span>
            <input type="range" min={40} max={100} defaultValue={75} className="mt-3 w-full" />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase text-[#557084]">Maximum ETA</span>
            <select className="mt-2 w-full rounded-md border border-[#BFD9DB] bg-[#F8FCFC] px-3 py-3 outline-none">
              <option>15 minutes</option>
              <option>30 minutes</option>
              <option>Any available pharmacy</option>
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-md border border-[#BFD9DB] bg-[#F8FCFC] p-3 text-sm font-bold text-[#31556A]">
            <input type="checkbox" defaultChecked />
            Show pharmacist-verified stock only
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setFilterOpen(false)} className="h-10 rounded-md border border-[#BFD9DB] px-4 text-sm font-bold text-[#31556A]">
              Cancel
            </button>
            <button className="h-10 rounded-md bg-[#0D8F93] px-4 text-sm font-bold text-white">Apply filters</button>
          </div>
        </form>
      </Modal>

      <Modal
        title={activeDialog?.type === "call" ? "Call Pharmacy" : "Reserve Medicine"}
        open={Boolean(activeDialog)}
        onClose={() => setActiveDialog(null)}
      >
        {activeDialog && (
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (activeDialog.type === "reserve") {
                onReserve(activeDialog.match.name);
                setNotice(`Reservation request prepared for ${activeDialog.match.medicine} at ${activeDialog.match.name}.`);
              } else {
                setNotice(`Call task opened for ${activeDialog.match.name}: ${activeDialog.match.phone}.`);
              }
              setActiveDialog(null);
            }}
          >
            <div className="rounded-md border border-[#BFD9DB] bg-[#F8FCFC] p-4">
              <h3 className="font-bold">{activeDialog.match.name}</h3>
              <p className="mt-1 text-sm text-[#557084]">
                {activeDialog.match.medicine} - {activeDialog.match.stock} units - ETA {activeDialog.match.eta}
              </p>
            </div>
            {activeDialog.type === "reserve" ? (
              <>
                <label className="block">
                  <span className="text-xs font-bold uppercase text-[#557084]">Patient name</span>
                  <input className="mt-2 w-full rounded-md border border-[#BFD9DB] bg-[#F8FCFC] px-3 py-3 outline-none" defaultValue="Emergency user" required />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase text-[#557084]">Quantity</span>
                  <input className="mt-2 w-full rounded-md border border-[#BFD9DB] bg-[#F8FCFC] px-3 py-3 outline-none" type="number" min={1} max={activeDialog.match.stock} defaultValue={1} required />
                </label>
              </>
            ) : (
              <label className="block">
                <span className="text-xs font-bold uppercase text-[#557084]">Call note</span>
                <textarea className="mt-2 min-h-24 w-full rounded-md border border-[#BFD9DB] bg-[#F8FCFC] px-3 py-3 outline-none" defaultValue={`Confirm availability for ${activeDialog.match.medicine}.`} />
              </label>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setActiveDialog(null)} className="h-10 rounded-md border border-[#BFD9DB] px-4 text-sm font-bold text-[#31556A]">
                Cancel
              </button>
              <button className="h-10 rounded-md bg-[#0D8F93] px-4 text-sm font-bold text-white">
                {activeDialog.type === "reserve" ? "Submit reservation" : "Save call task"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

function PharmacyCard({
  match,
  reserved,
  onCall,
  onReserve,
}: {
  match: PharmacyMatch;
  reserved: boolean;
  onCall: () => void;
  onReserve: () => void;
}) {
  return (
    <article className="rounded-md border border-[#BFD9DB] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold">{match.name}</h3>
            {match.verified && <StatusBadge label="Verified" tone="teal" />}
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm text-[#557084]">
            <MapPin size={15} />
            {match.area} - {match.distance} - ETA {match.eta}
          </p>
          <p className="mt-3 text-sm text-[#557084]">
            {match.medicine} available stock: <span className="font-bold text-[#092C46]">{match.stock} units</span>
          </p>
        </div>
        <div className="grid min-w-[150px] grid-cols-2 gap-2 text-center">
          <Score label="Confidence" value={match.confidence} tone={match.confidence > 85 ? "teal" : "amber"} />
          <Score label="Rescue" value={match.rescueScore} tone={match.rescueScore > 85 ? "teal" : "amber"} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={onReserve}
          className={`inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-bold ${
            reserved ? "bg-[#1D7A52] text-white" : "bg-[#0D8F93] text-white"
          }`}
        >
          <CheckCircle2 size={17} />
          {reserved ? "Reserved" : "Reserve medicine"}
        </button>
        <button
          type="button"
          onClick={onCall}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-[#BFD9DB] bg-white px-4 text-sm font-bold text-[#31556A]"
        >
          <PhoneCall size={17} />
          Call pharmacy
        </button>
      </div>
    </article>
  );
}
