import { LocationPicker } from "../components/LocationPicker";
import { useEffect, useState, type FormEvent } from "react";
import type { InventoryItem, MedicineLocation, SessionUser } from "../types";
import { EmptyState, InventoryTable, LoadingState, Modal, Panel } from "../components/ui";
import { ValidatedForm, ValidatedInput } from "../components/ValidatedForm";
import { createInventory, fetchMyLocation, updateInventory, updateLocation } from "../services/api";
import { useI18n } from "../i18n";
import { MAX_STOCK } from "../validation";

export function InventoryPage({ items, user, onChanged }: { items: InventoryItem[]; user: SessionUser; onChanged: () => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [location, setLocation] = useState<MedicineLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationFailed, setLocationFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let alive = true;
    setLocationLoading(true); setLocationFailed(false);
    fetchMyLocation().then(value => { if (alive) setLocation(value); })
      .catch(error => { if (alive) { setMessage(error.message); setLocationFailed(true); } })
      .finally(() => { if (alive) setLocationLoading(false); });
    return () => { alive = false; };
  }, [items]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      if (editing) await updateInventory(editing.id, Number(data.get("stock")), Number(data.get("reorder_level")));
      else {
        const payload = Object.fromEntries([...data.entries()].map(([key, value]) => [key,
          ["stock", "reorder_level", "latitude", "longitude"].includes(key) ? Number(value) :
          ["is_open", "requires_prescription"].includes(key) ? value === "true" : value]));
        if (location) Object.assign(payload, {
          pharmacy_name: location.name, area: location.area, contact_number: location.contact_number,
          latitude: location.latitude, longitude: location.longitude,
          is_open: location.is_open, opening_hours: location.opening_hours,
        });
        await createInventory(payload);
      }
      setOpen(false); setEditing(null); setMessage("Stock saved successfully"); onChanged();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Request failed. Please try again."); }
    finally { setBusy(false); }
  }

  async function saveLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      setLocation(await updateLocation({ name: data.get("name"), area: data.get("area"),
        contact_number: data.get("contact_number"), latitude: Number(data.get("latitude")),
        longitude: Number(data.get("longitude")), is_open: data.get("is_open") === "true",
        opening_hours: data.get("opening_hours") }));
      setMessage("Medicine location updated"); onChanged();
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }

  return <div className="grid gap-5">
    <Panel title="My medicine stock" action={<button className="action" disabled={locationLoading || locationFailed || busy} onClick={() => { setEditing(null); setMessage(""); setOpen(true); }}>{t("Add medicine")}</button>}>
      <p className="mb-4 text-sm">{t("Keep your available medicine stock up to date so people can find the correct pickup location.")}</p>
      {locationLoading && <LoadingState label="Loading data..." />}
      {location && <p className="mb-3 font-bold">{t(location.location_type)}: {location.name}</p>}
      {items.length ? <InventoryTable items={items} /> : <EmptyState title="No inventory records" detail="Add your first medicine and your institution details to start sharing availability." />}
      <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">{items.map(item => <button className="secondary" key={item.id} disabled={busy} onClick={() => { setEditing(item); setMessage(""); setOpen(true); }}>{t("Update stock")}: {item.medicine}</button>)}</div>
    </Panel>
    {message && <p role="status">{t(message)}</p>}
    {location && <Panel title="Medicine pickup location">
      <p className="mb-3 text-sm">{t("Only open locations with sufficient stock appear in search results. Update your address and coordinates carefully.")}</p>
      <ValidatedForm key={JSON.stringify(location)} className="grid gap-3" onSubmit={saveLocation}>
        <LocationFields location={location} hospital={user.role === "Hospital Staff"} />
        <button className="action" disabled={busy}>{t("Save location details")}</button>
      </ValidatedForm>
    </Panel>}
    <Modal title={editing ? "Update stock" : "Add medicine"} open={open} onClose={() => { if (!busy) setOpen(false); }}>
      <ValidatedForm key={`${open}-${editing?.id ?? "new"}`} onSubmit={save} className="grid gap-4">
        {!editing && <>
          {[["medicine", "Medicine", 160], ["generic", "Generic name", 160], ["strength", "Strength", 80], ["category", "Category", 100]].map(([name, label, max]) => <label key={name}>{t(String(label))}<ValidatedInput className="field" name={String(name)} maxLength={Number(max)} required={name !== "strength"} /></label>)}
          <label>{t("Prescription required")}<select className="field" name="requires_prescription"><option value="true">{t("Yes")}</option><option value="false">{t("No")}</option></select></label>
          {!location && <LocationFields registration hospital={user.role === "Hospital Staff"} />}
        </>}
        <label>{t("Total stock")}<ValidatedInput className="field" name="stock" type="number" max={MAX_STOCK} min={editing?.reserved ?? 0} defaultValue={editing?.stock ?? 0} required /></label>
        <label>{t("Reorder level")}<ValidatedInput className="field" name="reorder_level" type="number" max={MAX_STOCK} min={0} defaultValue={editing?.reorderLevel ?? 0} required /></label>
        <button className="action" disabled={busy}>{t(busy ? "Saving..." : "Save stock")}</button>
        {message && <p role="alert">{t(message)}</p>}
      </ValidatedForm>
    </Modal>
  </div>;
}

function LocationFields({ location, registration = false, hospital }: { location?: MedicineLocation; registration?: boolean; hospital: boolean }) {
  const { t } = useI18n();
  const [latitude, setLatitude] = useState(String(location?.latitude ?? ""));
  const [longitude, setLongitude] = useState(String(location?.longitude ?? ""));
  return <>
    <label>{t(hospital ? "Hospital / institution name" : "Pharmacy name")}<ValidatedInput className="field" name={registration ? "pharmacy_name" : "name"} defaultValue={location?.name} maxLength={160} required /></label>
    <label>{t("Address")}<ValidatedInput className="field" name="area" defaultValue={location?.area} maxLength={255} required /></label>
    <label>{t("Phone")}<ValidatedInput className="field" name="contact_number" type="tel" defaultValue={location?.contact_number} maxLength={32} required /></label>
    <LocationPicker institution latitude={latitude} longitude={longitude} onChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }} />
    <label>{t("Current status")}<select name="is_open" className="field" defaultValue={location?.is_open ? "true" : "false"}><option value="false">{t("Closed")}</option><option value="true">{t("Open")}</option></select></label>
    <label>{t("Opening hours")}<ValidatedInput className="field" name="opening_hours" defaultValue={location?.opening_hours} maxLength={255} /></label>
  </>;
}
