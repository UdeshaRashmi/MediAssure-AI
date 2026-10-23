import { Menu, LogOut } from "lucide-react";
import { getNavGroupsForRole } from "../roleAccess";
import type { ApiStatus } from "../services/api";
import type { Page, SessionUser } from "../types";
import logo from "../logo1-transparent-tight.png";
import { LanguageSwitch, useI18n } from "../i18n";

export function TopBar({ user, onLogout, onMenuToggle }: { apiStatus: ApiStatus; menuOpen: boolean; user: SessionUser; onLogout: () => void; onMenuToggle: () => void }) {
  const { t } = useI18n();
  return <header className="border-b bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3"><div className="flex items-center gap-3"><button className="secondary lg:hidden" aria-label={t("Open menu")} onClick={onMenuToggle}><Menu /></button><img src={logo} alt="MediAssure" className="h-16 w-16 object-contain" /><div><h2 className="text-xl font-bold">MediAssure AI</h2><p>{t(user.role)}</p></div></div><div className="flex items-center gap-3"><LanguageSwitch /><button className="secondary flex items-center gap-2" onClick={onLogout}><LogOut size={18} />{t("Sign out")}</button></div></div></header>;
}
export function Sidebar({ activePage, menuOpen, user, onNavigate }: { activePage: Page; apiStatus: ApiStatus; menuOpen: boolean; user: SessionUser; onNavigate: (page: Page) => void }) {
  const { t } = useI18n();
  return <aside className={`${menuOpen ? "block" : "hidden"} rounded-lg border bg-white p-3 lg:block`}><div className="mb-3 rounded bg-[#092C46] p-4 text-white"><p>{t(user.role)}</p><h2 className="mt-2 font-bold">{user.name}</h2><p className="break-all text-sm">{user.email}</p></div><nav>{getNavGroupsForRole(user.role).map(group => <div key={group.title}><p className="px-2 py-3 text-sm font-bold">{t(group.title)}</p>{group.items.map(item => <button className={`mb-1 flex w-full items-center gap-3 rounded p-3 text-left ${activePage === item.id ? "bg-[#0D8F93] text-white" : "hover:bg-[#E7F7F6]"}`} key={item.id} onClick={() => onNavigate(item.id)}>{item.icon}{t(item.label)}</button>)}</div>)}</nav></aside>;
}
