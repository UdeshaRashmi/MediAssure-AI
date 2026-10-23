import { ValidatedForm, ValidatedInput } from "../components/ValidatedForm";
import { useState, type FormEvent } from "react";
import type { InventoryItem } from "../types";
import { EmptyState, InventoryTable, Modal, Panel } from "../components/ui";
import { createInventory, updateInventory, updatePharmacy } from "../services/api";
import { useI18n } from "../i18n";

export function InventoryPage({ items, onChanged }: { items: InventoryItem[]; onChanged: () => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      if (editing) await updateInventory(editing.id, Number(data.get("stock")), Number(data.get("reorder_level")));
      else await createInventory(Object.fromEntries([...data.entries()].map(([key, value]) => [key, ["stock", "reorder_level", "latitude", "longitude"].includes(key) ? Number(value) : ["is_open", "requires_prescription"].includes(key) ? value === "true" : value])));
      setOpen(false); setEditing(null); setMessage("Stock saved successfully"); onChanged();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Request failed. Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="grid gap-5">
    <Panel title="Inventory Management" action={<button className="action" onClick={() => { setEditing(null); setOpen(true); }}>{t("Add medicine")}</button>}>
      {items.length ? <InventoryTable items={items} /> : <EmptyState title="No inventory records" detail="Add your first medicine to register your pharmacy and begin managing stock." />}
      <div className="mt-4 flex flex-wrap gap-2">{items.map(item => <button className="secondary" key={item.id} onClick={() => { setEditing(item); setOpen(true); }}>{t("Update stock")}: {item.medicine}</button>)}</div>
    </Panel>
    {message && <p role="status">{t(message)}</p>}
    {items.length > 0 && <Panel title="Pharmacy availability"><ValidatedForm className="grid gap-3" onSubmit={async e => { e.preventDefault(); const data = new FormData(e.currentTarget); setBusy(true); try { await updatePharmacy(data.get("is_open") === "true", String(data.get("opening_hours"))); setMessage("Pharmacy updated"); onChanged(); } catch (error) { setMessage((error as Error).message); } finally { setBusy(false); } }}>
      <label>{t("Current status")}<select name="is_open" className="field"><option value="true">{t("Open")}</option><option value="false">{t("Closed")}</option></select></label>
      <label>{t("Opening hours")}<ValidatedInput name="opening_hours" className="field" maxLength={255} /></label><button className="action" disabled={busy}>{t("Save availability")}</button>
    </ValidatedForm></Panel>}
    <Modal title={editing ? "Update stock" : "Add medicine"} open={open} onClose={() => { if (!busy) setOpen(false); }}>
      <ValidatedForm key={`${open}-${editing?.id ?? "new"}`} onSubmit={save} className="grid max-h-[75vh] gap-3 overflow-y-auto pr-2">
        {!editing && <>
          {[ ["medicine", "Medicine"], ["generic", "Generic name"], ["strength", "Strength"], ["category", "Category"], ["pharmacy_name", "Pharmacy"], ["area", "Address"], ["contact_number", "Phone"] ].map(([name, label]) => <label key={name}>{t(label)}<ValidatedInput className="field" name={name} type={name === "contact_number" ? "tel" : "text"} maxLength={name === "category" ? 100 : name === "strength" ? 80 : name === "area" ? 255 : name === "contact_number" ? 32 : 160} required={name !== "strength"} defaultValue={name === "pharmacy_name" ? items[0]?.pharmacyName : undefined} /></label>)}
          <div className="grid grid-cols-2 gap-3"><label>{t("Latitude")}<ValidatedInput className="field" name="latitude" type="number" step="any" min={-90} max={90} required /></label><label>{t("Longitude")}<ValidatedInput className="field" name="longitude" type="number" step="any" min={-180} max={180} required /></label></div>
          <label>{t("Prescription required")}<select className="field" name="requires_prescription"><option value="true">{t("Yes")}</option><option value="false">{t("No")}</option></select></label>
          <label>{t("Pharmacy status")}<select className="field" name="is_open"><option value="false">{t("Closed")}</option><option value="true">{t("Open")}</option></select></label>
          <label>{t("Opening hours")}<ValidatedInput className="field" name="opening_hours" maxLength={255} /></label>
        </>}
        <label>{t("Total stock")}<ValidatedInput className="field" name="stock" type="number" max={2147483647} min={editing?.reserved ?? 0} defaultValue={editing?.stock ?? 0} required /></label>
        <label>{t("Reorder level")}<ValidatedInput className="field" name="reorder_level" type="number" max={2147483647} min={0} defaultValue={editing?.reorderLevel ?? 0} required /></label>
        <button className="action" disabled={busy}>{t(busy ? "Saving..." : "Save stock")}</button>
        {message && <p role="alert">{t(message)}</p>}
      </ValidatedForm>
    </Modal>
  </div>;
}
