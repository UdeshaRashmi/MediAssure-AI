import type { ReactNode } from "react";
import {
  ArrowRightLeft,
  Bell,
  Boxes,
  ChevronRight,
  ClipboardCheck,
  LayoutDashboard,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import type { Page } from "../types";
import logo1 from "../logo1-transparent-tight.png";
import { IconButton } from "./ui";

const navItems: { id: Page; label: string; icon: ReactNode }[] = [
  { id: "finder", label: "Find Medicine", icon: <Search size={18} /> },
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { id: "inventory", label: "Inventory", icon: <Boxes size={18} /> },
  { id: "reservations", label: "Reservations", icon: <ClipboardCheck size={18} /> },
  { id: "rebalancing", label: "Rebalancing", icon: <ArrowRightLeft size={18} /> },
  { id: "alerts", label: "Alerts", icon: <Bell size={18} /> },
];

export function TopBar({ menuOpen, onMenuToggle }: { menuOpen: boolean; onMenuToggle: () => void }) {
  return (
    <header className="border-b border-[#BFD9DB] bg-white">
      <div className="mx-auto flex max-w-7xl flex-nowrap items-center justify-between gap-2 px-3 py-2 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            title={menuOpen ? "Close menu" : "Open menu"}
            onClick={onMenuToggle}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-[#BFD9DB] bg-white text-[#0D8F93] lg:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <img src={logo1} alt="MediAssure" className="h-16 w-16 shrink-0 object-contain p-1 sm:h-32 sm:w-32 sm:p-2" />
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-[#092C46] sm:text-2xl">Predictive Pharmacy Console</h2>
            <p className="hidden text-sm text-[#557084] md:block">Inventory, reservations, and rescue matching</p>
          </div>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <IconButton label="AI insights">
            <Sparkles size={18} />
          </IconButton>
          <IconButton label="Notifications">
            <Bell size={18} />
          </IconButton>
          <button className="hidden h-11 items-center gap-2 rounded-md bg-[#092C46] px-4 text-sm font-bold text-white sm:inline-flex">
            <ShieldCheck size={17} />
            Pharmacist
          </button>
        </div>
      </div>
    </header>
  );
}

export function Sidebar({
  activePage,
  menuOpen,
  onNavigate,
}: {
  activePage: Page;
  menuOpen: boolean;
  onNavigate: (page: Page) => void;
}) {
  return (
    <aside className={`${menuOpen ? "block" : "hidden"} rounded-lg border border-[#BFD9DB] bg-white p-3 shadow-sm lg:block`}>
      <div className="mb-3 rounded-lg bg-[#092C46] p-4 text-white">
        <p className="text-xs font-semibold uppercase text-[#7DE3E0]">Pharmacist Portal</p>
        <p className="mt-2 text-lg font-semibold">City Care Pharmacy</p>
        <p className="mt-1 text-sm text-[#CFEAEB]">Colombo 07 - Open now</p>
      </div>
      <nav className="grid gap-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex h-11 items-center justify-between rounded-md px-3 text-sm font-semibold transition ${
              activePage === item.id ? "bg-[#0D8F93] text-white" : "text-[#31556A] hover:bg-[#E7F7F6]"
            }`}
          >
            <span className="flex items-center gap-3">
              {item.icon}
              {item.label}
            </span>
            <ChevronRight size={16} />
          </button>
        ))}
      </nav>
    </aside>
  );
}

export function SearchBox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex w-full items-center gap-2 rounded-md border border-[#BFD9DB] bg-white px-3 sm:w-80">
      <Search size={18} className="text-[#0D8F93]" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent py-3 outline-none"
        placeholder="Search medicine, pharmacy, category"
      />
    </div>
  );
}
