import type { ReactNode } from "react";
import {
  Bell,
  ChevronRight,
  LogOut,
  Menu,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { getNavGroupsForRole } from "../roleAccess";
import type { ApiStatus } from "../services/api";
import type { Page, SessionUser } from "../types";
import logo1 from "../logo1-transparent-tight.png";
import { IconButton } from "./ui";

export function TopBar({
  apiStatus,
  menuOpen,
  user,
  onLogout,
  onMenuToggle,
}: {
  apiStatus: ApiStatus;
  menuOpen: boolean;
  user: SessionUser;
  onLogout: () => void;
  onMenuToggle: () => void;
}) {
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
            <p className="hidden text-sm text-[#557084] md:block">Emergency matching, forecasting, and pharmacy coordination</p>
          </div>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <div className="rounded-md border border-[#BFD9DB] bg-[#F8FCFC] px-3 py-2">
            <p className="text-xs font-bold uppercase text-[#557084]">API</p>
            <p className={`text-sm font-bold ${apiStatus === "online" ? "text-[#0D8F93]" : "text-[#B87500]"}`}>
              {apiStatus === "checking" ? "Checking" : apiStatus === "online" ? "Online" : "Offline"}
            </p>
          </div>
          <IconButton label="Forecast radar">
            <Radar size={18} />
          </IconButton>
          <IconButton label="Notifications">
            <Bell size={18} />
          </IconButton>
          <button className="hidden h-11 items-center gap-2 rounded-md bg-[#092C46] px-4 text-sm font-bold text-white sm:inline-flex">
            <ShieldCheck size={17} />
            {user.role}
          </button>
          <button
            title="Sign out"
            onClick={onLogout}
            className="grid h-11 w-11 place-items-center rounded-md border border-[#BFD9DB] bg-white text-[#31556A]"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

export function Sidebar({
  activePage,
  apiStatus,
  menuOpen,
  user,
  onNavigate,
}: {
  activePage: Page;
  apiStatus: ApiStatus;
  menuOpen: boolean;
  user: SessionUser;
  onNavigate: (page: Page) => void;
}) {
  const navGroups = getNavGroupsForRole(user.role);

  return (
    <aside className={`${menuOpen ? "block" : "hidden"} rounded-lg border border-[#BFD9DB] bg-white p-3 shadow-sm lg:block`}>
      <div className="mb-3 rounded-lg bg-[#092C46] p-4 text-white">
        <p className="text-xs font-semibold uppercase text-[#7DE3E0]">{user.role} Portal</p>
        <p className="mt-2 text-lg font-semibold">{user.name}</p>
        <p className="mt-1 truncate text-sm text-[#CFEAEB]">{user.email}</p>
        <div className="mt-3 inline-flex rounded-md bg-white/10 px-2 py-1 text-xs font-bold text-[#CFEAEB]">
          API {apiStatus === "online" ? "online" : apiStatus === "checking" ? "checking" : "offline"}
        </div>
      </div>
      <nav className="grid gap-1">
        {navGroups.map((group) => (
          <div key={group.title} className="grid gap-1">
            <p className="px-3 pb-1 pt-3 text-xs font-bold uppercase text-[#7A93A3]">{group.title}</p>
            {group.items.map((item) => (
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
          </div>
        ))}
      </nav>
      <div className="mt-4 rounded-md border border-[#D8E8E8] bg-[#F8FCFC] p-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[#092C46]">
          <Sparkles size={16} className="text-[#0D8F93]" />
          AI stock guard
        </div>
        <p className="mt-2 text-xs leading-5 text-[#557084]">Watching 4 critical medicines across 12 partner locations.</p>
      </div>
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
