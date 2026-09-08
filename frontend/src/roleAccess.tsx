import type { ReactNode } from "react";
import {
  ArrowRightLeft,
  Bell,
  Boxes,
  ClipboardCheck,
  Hospital,
  LayoutDashboard,
  Search,
  Settings,
  Siren,
  TrendingUp,
} from "lucide-react";
import type { Page, SessionUser } from "./types";

export type NavGroup = {
  title: string;
  items: { id: Page; label: string; icon: ReactNode }[];
};

export const defaultPageByRole: Record<SessionUser["role"], Page> = {
  Patient: "request",
  Pharmacist: "dashboard",
  "Hospital Staff": "request",
  Admin: "dashboard",
};

const pagesByRole: Record<SessionUser["role"], Page[]> = {
  Patient: ["request", "finder", "reservations", "settings"],
  Pharmacist: ["dashboard", "inventory", "forecast", "reservations", "rebalancing", "alerts", "settings"],
  "Hospital Staff": ["request", "finder", "reservations", "network", "alerts", "settings"],
  Admin: ["dashboard", "inventory", "forecast", "reservations", "rebalancing", "network", "alerts", "settings"],
};

const allNavGroups: NavGroup[] = [
  {
    title: "Emergency access",
    items: [
      { id: "request", label: "Request Flow", icon: <Siren size={18} /> },
      { id: "finder", label: "Find Medicine", icon: <Search size={18} /> },
      { id: "reservations", label: "Reservations", icon: <ClipboardCheck size={18} /> },
    ],
  },
  {
    title: "Pharmacy operations",
    items: [
      { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
      { id: "inventory", label: "Inventory", icon: <Boxes size={18} /> },
      { id: "forecast", label: "Forecasts", icon: <TrendingUp size={18} /> },
      { id: "rebalancing", label: "Rebalancing", icon: <ArrowRightLeft size={18} /> },
      { id: "network", label: "Network", icon: <Hospital size={18} /> },
      { id: "alerts", label: "Alerts", icon: <Bell size={18} /> },
      { id: "settings", label: "Settings", icon: <Settings size={18} /> },
    ],
  },
];

export function getAllowedPages(role: SessionUser["role"]) {
  return pagesByRole[role];
}

export function getNavGroupsForRole(role: SessionUser["role"]) {
  const allowedPages = new Set(getAllowedPages(role));

  return allNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => allowedPages.has(item.id)),
    }))
    .filter((group) => group.items.length > 0);
}

export function canAccessPage(role: SessionUser["role"], page: Page) {
  return pagesByRole[role].includes(page);
}

