import type { ReactNode } from "react";
import { AlertTriangle, MapPin } from "lucide-react";
import type { BadgeTone, InventoryItem } from "../types";

export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[#BFD9DB] bg-[#F8FCFC] p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[#092C46]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function IconButton({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button
      title={label}
      className="grid h-11 w-11 place-items-center rounded-md border border-[#BFD9DB] bg-white text-[#0D8F93]"
    >
      {children}
    </button>
  );
}

export function StatusBadge({ label, tone }: { label: string; tone: BadgeTone }) {
  const toneClass = {
    teal: "bg-[#E7F7F6] text-[#0D8F93]",
    danger: "bg-[#FDEBEC] text-[#C94D57]",
    amber: "bg-[#FFF4D8] text-[#A66B00]",
  }[tone];

  return <span className={`rounded-md px-3 py-1 text-xs font-bold ${toneClass}`}>{label}</span>;
}

export function Chip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md bg-[#E7F7F6] px-3 py-2 text-xs font-bold text-[#0D8F93]">
      {icon}
      {label}
    </span>
  );
}

export function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#D8E8E8] bg-white p-3">
      <p className="text-xs font-bold uppercase text-[#557084]">{label}</p>
      <p className="mt-1 text-xl font-bold text-[#092C46]">{value}</p>
    </div>
  );
}

export function Metric({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "teal" | "danger" | "amber" | "navy";
}) {
  const color = {
    teal: "bg-[#E7F7F6] text-[#0D8F93]",
    danger: "bg-[#FDEBEC] text-[#C94D57]",
    amber: "bg-[#FFF4D8] text-[#A66B00]",
    navy: "bg-[#E9F0F5] text-[#092C46]",
  }[tone];

  return (
    <div className="rounded-lg border border-[#BFD9DB] bg-white p-4 shadow-sm">
      <div className={`grid h-10 w-10 place-items-center rounded-md ${color}`}>{icon}</div>
      <p className="mt-4 text-xs font-bold uppercase text-[#557084]">{label}</p>
      <p className="mt-1 text-3xl font-bold text-[#092C46]">{value}</p>
    </div>
  );
}

export function Score({ label, value, tone }: { label: string; value: number; tone: "teal" | "amber" }) {
  const color = tone === "teal" ? "text-[#0D8F93]" : "text-[#B87500]";

  return (
    <div className="rounded-md bg-[#F8FCFC] p-3">
      <p className="text-xs font-bold uppercase text-[#557084]">{label}</p>
      <p className={`mt-1 text-xl font-bold ${color}`}>{value}%</p>
    </div>
  );
}

export function SafetyItem({ title, detail }: { title: string; detail: string }) {
  return (
    <article className="rounded-md border border-[#BFD9DB] bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#FDEBEC] text-[#C94D57]">
          <AlertTriangle size={18} />
        </div>
        <div>
          <h3 className="font-bold">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-[#557084]">{detail}</p>
        </div>
      </div>
    </article>
  );
}

export function AvailabilityCard({
  medicine,
  confidence,
  eta,
  stock,
}: {
  medicine: string;
  confidence: number;
  eta: string;
  stock: string;
}) {
  return (
    <article className="rounded-md border border-[#BFD9DB] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold">{medicine}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-[#557084]">
            <MapPin size={15} />
            City Care Pharmacy - {eta}
          </p>
        </div>
        <StatusBadge label={`${confidence}%`} tone={confidence > 85 ? "teal" : "amber"} />
      </div>
      <p className="mt-3 text-sm text-[#557084]">Available stock: {stock}</p>
    </article>
  );
}

export function InventoryTable({ items, compact = false }: { items: InventoryItem[]; compact?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-md border border-[#BFD9DB]">
      <div className="min-w-[620px]">
        <div className="grid grid-cols-[1.4fr_0.7fr_0.7fr_0.8fr] bg-[#092C46] px-4 py-3 text-xs font-bold uppercase text-[#CFEAEB]">
          <span>Medicine</span>
          <span>Stock</span>
          <span>24h Demand</span>
          <span>Status</span>
        </div>
        {items.map((item) => (
          <div
            key={item.medicine}
            className="grid grid-cols-[1.4fr_0.7fr_0.7fr_0.8fr] items-center border-t border-[#D8E8E8] bg-white px-4 py-3 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-bold">{item.medicine}</p>
              {!compact && <p className="mt-1 truncate text-xs text-[#557084]">{item.generic} - {item.category}</p>}
            </div>
            <span className="font-bold">{item.stock - item.reserved}</span>
            <span>{item.predicted24h}</span>
            <StatusBadge label={item.status} tone={item.status === "Low" ? "danger" : item.status === "Watch" ? "amber" : "teal"} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BarChart({
  data,
  valueKey,
  max,
  dangerAt,
}: {
  data: { label: string; value: number }[];
  valueKey: string;
  max?: number;
  dangerAt?: number;
}) {
  const chartMax = max ?? Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="rounded-md border border-[#BFD9DB] bg-white p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-[#092C46]">{valueKey}</p>
        <p className="text-xs font-bold uppercase text-[#557084]">Live model</p>
      </div>
      <div className="flex h-56 items-end gap-3">
        {data.map((item) => {
          const height = Math.max((item.value / chartMax) * 100, 6);
          const isDanger = dangerAt ? item.value >= dangerAt : false;

          return (
            <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <span className="text-xs font-bold text-[#31556A]">{item.value}</span>
              <div className="flex h-40 w-full items-end rounded-md bg-[#F2F7F7] px-1">
                <div
                  className={`w-full rounded-t-md ${isDanger ? "bg-[#C94D57]" : "bg-[#0D8F93]"}`}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="w-full truncate text-center text-xs font-semibold text-[#557084]" title={item.label}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
