import type { ReactNode } from "react";
import type { InventoryItem } from "../types";
import { useI18n } from "../i18n";
export function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  const { t } = useI18n();
  return <section className="rounded-lg border border-[#BFD9DB] bg-[#F8FCFC] p-4 shadow-sm"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">{t(title)}</h2>{action}</div>{children}</section>;
}
export function EmptyState({ title, detail }: { title: string; detail: string }) { const { t } = useI18n(); return <div className="rounded border border-dashed bg-white p-6 text-center"><p className="font-bold">{t(title)}</p><p className="mt-2 text-sm">{t(detail)}</p></div>; }
export function LoadingState({ label }: { label: string }) { const { t } = useI18n(); return <p className="rounded border bg-white p-4" role="status">{t(label)}</p>; }
export function InventoryTable({ items, compact = false }: { items: InventoryItem[]; compact?: boolean }) {
  const { t } = useI18n();
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-[#092C46] text-white"><tr>{["Medicine", "Pharmacy", "Available stock", "Reserved units", "Status"].map(label => <th className="p-3" key={label}>{t(label)}</th>)}</tr></thead><tbody>{items.map(item => <tr className="border-b bg-white" key={item.id}><td className="p-3 font-bold">{item.medicine}{!compact && <p className="text-xs font-normal">{item.generic} ? {item.category}</p>}</td><td className="p-3">{item.pharmacyName}</td><td className="p-3">{item.stock-item.reserved}</td><td className="p-3">{item.reserved}</td><td className="p-3">{t(item.status)}</td></tr>)}</tbody></table></div>;
}
export function Modal({ title, open, children, onClose }: { title: string; open: boolean; children: ReactNode; onClose: () => void }) {
  const { t } = useI18n();
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#092C46]/50 p-4"><section role="dialog" aria-modal="true" aria-label={t(title)} className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">{t(title)}</h2><button className="secondary" type="button" onClick={onClose}>{t("Close")}</button></div>{children}</section></div>;
}
