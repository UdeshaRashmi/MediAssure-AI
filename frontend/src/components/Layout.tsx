import { useEffect, useRef } from "react";
import { Menu, LogOut, X } from "lucide-react";
import { getNavGroupsForRole } from "../roleAccess";
import type { ApiStatus } from "../services/api";
import type { Page, SessionUser } from "../types";
import logo from "../logo1-transparent-tight.png";
import { LanguageSwitch, useI18n } from "../i18n";
import { RoleIllustration } from "./RoleIllustration";

export function TopBar({ user, menuOpen, onLogout, onMenuToggle }: {
  apiStatus: ApiStatus; menuOpen: boolean; user: SessionUser;
  onLogout: () => void; onMenuToggle: () => void;
}) {
  const { t } = useI18n();
  return <header className="sticky top-0 z-30 border-b border-[#BFD9DB] bg-white/95 backdrop-blur">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <button type="button" className="secondary shrink-0 lg:hidden" aria-label={t(menuOpen ? "Close menu" : "Open menu")} aria-expanded={menuOpen} aria-controls="workspace-navigation" onClick={onMenuToggle}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        <img src={logo} alt="MediAssure" className="h-10 w-10 shrink-0 object-contain sm:h-14 sm:w-14" />
        <div className="min-w-0"><h2 className="text-base font-bold leading-tight sm:text-xl">MediAssure AI</h2><p className="mt-1 text-xs text-[#557084] sm:text-sm">{t(user.role)}</p></div>
      </div>
      <div className="flex w-full min-w-0 items-center justify-between gap-2 border-t pt-2 sm:w-auto sm:border-0 sm:pt-0"><LanguageSwitch /><button type="button" className="secondary inline-flex shrink-0 items-center gap-2" onClick={onLogout}><LogOut size={17} /><span>{t("Sign out")}</span></button></div>
    </div>
  </header>;
}

export function Sidebar({ activePage, menuOpen, user, onNavigate, onClose }: {
  activePage: Page; apiStatus: ApiStatus; menuOpen: boolean; user: SessionUser;
  onNavigate: (page: Page) => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const sidebar = useRef<HTMLElement>(null);
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebar.current?.querySelector<HTMLButtonElement>("button")?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); close.current(); }
      if (event.key !== "Tab") return;
      const buttons = Array.from(sidebar.current?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]") ?? []).filter(node => node.getClientRects().length);
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", onKey); previous?.focus(); };
  }, [menuOpen]);
  return <>
    {menuOpen && <div className="fixed inset-0 z-40 bg-[#092C46]/45 lg:hidden" aria-hidden="true" onClick={onClose} />}
    <aside id="workspace-navigation" ref={sidebar} role={menuOpen ? "dialog" : undefined} aria-modal={menuOpen ? true : undefined} aria-label={t("Navigation")} className={`${menuOpen ? "block" : "hidden"} fixed inset-y-0 left-0 z-50 w-[min(20rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain border-r bg-white p-3 shadow-xl lg:sticky lg:top-28 lg:z-auto lg:block lg:max-h-[calc(100dvh-8rem)] lg:w-auto lg:self-start lg:rounded-lg lg:border lg:shadow-sm`}>
      <div className="mb-3 flex items-center justify-between gap-3 lg:hidden"><span className="font-bold">{t("Navigation")}</span><button type="button" className="secondary" aria-label={t("Close menu")} onClick={onClose}><X size={20} /></button></div>
      <div className="mb-3 rounded-lg bg-[#092C46] p-4 text-white"><RoleIllustration role={user.role} className="mb-3 h-28 w-full rounded-lg bg-[#F2F7F7]" /><p className="text-sm">{t(user.role)}</p><h2 className="mt-2 break-words font-bold">{user.name}</h2><p className="mt-1 break-all text-sm text-[#CFEAEB]">{user.email}</p></div>
      <nav>{getNavGroupsForRole(user.role).map(group => <div key={group.title}><p className="px-2 py-3 text-xs font-bold uppercase text-[#557084]">{t(group.title)}</p>{group.items.map(item => <button type="button" className={`mb-1 flex min-h-11 w-full items-center gap-3 rounded-lg p-3 text-left text-sm ${activePage === item.id ? "bg-[#0D8F93] text-white" : "hover:bg-[#E7F7F6]"}`} key={item.id} aria-current={activePage === item.id ? "page" : undefined} onClick={() => onNavigate(item.id)}><span className="shrink-0">{item.icon}</span><span className="min-w-0">{t(item.label)}</span></button>)}</div>)}</nav>
    </aside>
  </>;
}
