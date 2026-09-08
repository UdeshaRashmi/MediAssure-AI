import type { ReactNode } from "react";
import { Ambulance, ArrowRight, Clock, LocateFixed, Pill, ShieldCheck, UserRound } from "lucide-react";
import { pharmacyMatches, verifiedAlternatives } from "../data/mockData";
import { Panel, StatusBadge } from "../components/ui";
import type { Page } from "../types";

export function RequestPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <div className="grid gap-5">
      <section className="grid gap-5 rounded-lg border border-[#BFD9DB] bg-white p-4 shadow-sm xl:grid-cols-[1fr_360px]">
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#FDEBEC] text-[#C94D57]">
            <Ambulance size={24} />
          </div>
          <h2 className="mt-4 text-2xl font-bold">Emergency request intake</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#557084]">
            Capture the medicine need, urgency, and pickup area before matching the user to verified pharmacy stock.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Field label="Medicine needed" value="Salbutamol Inhaler" icon={<Pill size={17} />} />
            <Field label="Quantity" value="1 unit" icon={<ShieldCheck size={17} />} />
            <Field label="Patient type" value="Breathing difficulty" icon={<UserRound size={17} />} />
            <Field label="Pickup area" value="Colombo 07" icon={<LocateFixed size={17} />} />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => onNavigate("finder")}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-[#0D8F93] px-4 text-sm font-bold text-white"
            >
              Match pharmacies
              <ArrowRight size={17} />
            </button>
            <button
              onClick={() => onNavigate("reservations")}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-[#BFD9DB] bg-white px-4 text-sm font-bold text-[#31556A]"
            >
              View reservations
            </button>
          </div>
        </div>

        <div className="rounded-md border border-[#D8E8E8] bg-[#F8FCFC] p-4">
          <p className="text-sm font-bold text-[#092C46]">Recommended match</p>
          <h3 className="mt-3 text-xl font-bold">{pharmacyMatches[0].name}</h3>
          <p className="mt-1 text-sm text-[#557084]">
            {pharmacyMatches[0].area} - ETA {pharmacyMatches[0].eta} - {pharmacyMatches[0].stock} units available
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-md bg-white p-3">
              <p className="text-xs font-bold uppercase text-[#557084]">Confidence</p>
              <p className="mt-1 text-2xl font-bold text-[#0D8F93]">{pharmacyMatches[0].confidence}%</p>
            </div>
            <div className="rounded-md bg-white p-3">
              <p className="text-xs font-bold uppercase text-[#557084]">Travel risk</p>
              <p className="mt-1 text-2xl font-bold text-[#B87500]">Low</p>
            </div>
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#31556A]">
            <Clock size={16} />
            Reservation hold expires in 14 min
          </p>
        </div>
      </section>

      <Panel title="Verified Alternative Rules">
        <div className="grid gap-3 lg:grid-cols-3">
          {verifiedAlternatives.map((item) => (
            <article key={`${item.requested}-${item.alternative}`} className="rounded-md border border-[#BFD9DB] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-[#557084]">{item.type}</p>
                  <h3 className="mt-2 font-bold">{item.alternative}</h3>
                </div>
                <StatusBadge label={item.status} tone={item.status === "Display allowed" ? "teal" : "amber"} />
              </div>
              <p className="mt-3 text-sm text-[#557084]">Requested: {item.requested}</p>
              <p className="mt-1 text-sm font-semibold text-[#31556A]">{item.verifier}</p>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Field({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <label className="block rounded-md border border-[#BFD9DB] bg-[#F8FCFC] p-3">
      <span className="flex items-center gap-2 text-xs font-bold uppercase text-[#557084]">
        {icon}
        {label}
      </span>
      <input
        value={value}
        readOnly
        className="mt-2 w-full rounded-md border border-[#D8E8E8] bg-white px-3 py-2 text-sm font-semibold text-[#092C46]"
      />
    </label>
  );
}
