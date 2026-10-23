import { useEffect, useId, useRef, type ReactNode } from "react";
import type { InventoryItem } from "../types";
import { useI18n } from "../i18n";

export function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  const { t } = useI18n();
  return <section className="min-w-0 rounded-xl border border-[#BFD9DB] bg-[#F8FCFC] p-3 shadow-sm sm:p-5"><div className="mb-4 flex flex-wrap items-start justify-between gap-3"><h2 className="min-w-0 flex-1 text-base font-bold leading-snug sm:text-lg">{t(title)}</h2>{action}</div>{children}</section>;
}
export function EmptyState({ title, detail }: { title: string; detail: string }) { const { t } = useI18n(); return <div className="min-w-0 rounded-lg border border-dashed bg-white p-4 text-center sm:p-6"><p className="font-bold">{t(title)}</p><p className="mt-2 text-sm leading-relaxed">{t(detail)}</p></div>; }
export function LoadingState({ label }: { label: string }) { const { t } = useI18n(); return <p className="rounded border bg-white p-4" role="status">{t(label)}</p>; }

export function InventoryTable({ items, compact = false, actions }: { items: InventoryItem[]; compact?: boolean; actions?: (item: InventoryItem) => ReactNode }) {
  const { t } = useI18n();
  const tone = (status: string) => status === "Low" ? "bg-red-50 text-red-700" : status === "Watch" ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800";
  return <>
    <div className="grid gap-3 md:hidden" aria-label={t("Inventory Management")}>
      {items.map(item => <article className="min-w-0 rounded-lg border bg-white p-4" key={item.id}>
        <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="min-w-0 flex-1 font-bold">{item.medicine}</h3><span className={`rounded px-2 py-1 text-xs font-bold ${tone(item.status)}`}>{t(item.status)}</span></div>
        {!compact && <p className="mt-1 text-sm text-[#557084]">{item.generic} - {item.category}</p>}
        <p className="mt-2 text-sm">{item.pharmacyName}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3"><div><dt className="text-xs text-[#557084]">{t("Available stock")}</dt><dd className="mt-1 text-xl font-bold">{item.stock-item.reserved}</dd></div><div><dt className="text-xs text-[#557084]">{t("Reserved units")}</dt><dd className="mt-1 text-xl font-bold">{item.reserved}</dd></div></dl>
        {actions && <div className="mt-3 flex flex-wrap gap-2">{actions(item)}</div>}
      </article>)}
    </div>
    <div className="hidden max-w-full overflow-x-auto rounded-lg border md:block" role="region" aria-label={t("Inventory Management")} tabIndex={0}>
      <table className="w-full min-w-[600px] table-fixed text-left text-sm"><thead className="bg-[#092C46] text-white"><tr>{["Medicine", "Pharmacy", "Available stock", "Reserved units", "Status", ...(actions ? ["Actions"] : [])].map((label, index) => <th className={`p-3 ${actions ? (index === 0 ? "w-[24%]" : index === 1 ? "w-[20%]" : "w-[14%]") : (index === 0 ? "w-[30%]" : index === 1 ? "w-[25%]" : "w-[15%]")}`} scope="col" key={label}>{t(label)}</th>)}</tr></thead><tbody>{items.map(item => <tr className="border-t bg-white" key={item.id}><td className="p-3 align-top font-bold">{item.medicine}{!compact && <p className="mt-1 text-xs font-normal text-[#557084]">{item.generic} - {item.category}</p>}</td><td className="p-3 align-top">{item.pharmacyName}</td><td className="p-3 align-top">{item.stock-item.reserved}</td><td className="p-3 align-top">{item.reserved}</td><td className="p-3 align-top"><span className={`inline-block rounded px-2 py-1 text-xs font-bold ${tone(item.status)}`}>{t(item.status)}</span></td>{actions && <td className="p-3 align-top"><div className="flex flex-col gap-2">{actions(item)}</div></td>}</tr>)}</tbody></table>
    </div>
  </>;
}

export function Modal({ title, open, children, onClose }: { title: string; open: boolean; children: ReactNode; onClose: () => void }) {
  const { t } = useI18n();
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!open || !dialog.current) return;
    const node = dialog.current;
    const previousOverflow = document.body.style.overflow;
    node.showModal(); document.body.style.overflow = "hidden";
    return () => { node.close(); document.body.style.overflow = previousOverflow; };
  }, [open]);
  return <dialog ref={dialog} aria-labelledby={id} className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto overscroll-contain rounded-xl border-0 bg-white p-0 text-[#092C46] shadow-xl backdrop:bg-[#092C46]/50" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b bg-white p-4 sm:p-5"><h2 id={id} className="min-w-0 flex-1 pt-1 text-lg font-bold sm:text-xl">{t(title)}</h2><button className="secondary shrink-0" type="button" onClick={onClose}>{t("Close")}</button></div><div className="p-4 sm:p-5">{children}</div>
  </dialog>;
}
