import { useEffect, useRef, useState } from "react";
import { LocateFixed } from "lucide-react";
import { ValidatedInput, useFieldValidation } from "./ValidatedForm";
import { useI18n } from "../i18n";
import { detectLocation } from "../services/location";

export function LocationPicker({ latitude, longitude, onChange, institution = false, className = "" }: {
  latitude: string; longitude: string;
  onChange: (latitude: string, longitude: string) => void;
  institution?: boolean; className?: string;
}) {
  const { t } = useI18n();
  const { clearFields } = useFieldValidation();
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const mounted = useRef(false);
  const pending = useRef(false);
  const change = useRef(onChange);
  change.current = onChange;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function locate() {
    if (pending.current) return;
    pending.current = true; setLocating(true); setError(""); setAccuracy(null);
    try {
      const position = await detectLocation();
      if (!mounted.current) return;
      change.current(String(position.latitude), String(position.longitude));
      clearFields(["latitude", "longitude"]);
      setAccuracy(Number.isFinite(position.accuracy) ? Math.ceil(position.accuracy) : null);
    } catch (error) {
      if (mounted.current) setError(error instanceof Error ? error.message : "Location could not be determined. Try again or enter coordinates manually.");
    } finally { pending.current = false; if (mounted.current) setLocating(false); }
  }
  function edit(nextLatitude: string, nextLongitude: string) { setAccuracy(null); setError(""); onChange(nextLatitude, nextLongitude); }
  return <div className={`grid gap-3 ${className}`}>
    <div><button type="button" className="secondary inline-flex items-center gap-2" onClick={locate} disabled={locating} aria-busy={locating}><LocateFixed size={17} />{t(locating ? "Detecting location..." : "Use my location")}</button></div>
    <p className="text-sm text-[#557084]">{t(institution ? "Use this while at your pharmacy or hospital. Check the map before saving the pickup location." : "Allow location access to fill your coordinates automatically. You can also enter them manually.")}</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <label>{t("Latitude")}<ValidatedInput className="field" name="latitude" type="number" step="any" min={-90} max={90} value={latitude} onChange={e => edit(e.target.value, longitude)} required readOnly={locating} /></label>
      <label>{t("Longitude")}<ValidatedInput className="field" name="longitude" type="number" step="any" min={-180} max={180} value={longitude} onChange={e => edit(latitude, e.target.value)} required readOnly={locating} /></label>
    </div>
    {accuracy !== null && <p className="text-sm" role="status">{t("Location detected. Estimated accuracy (metres)")}: {accuracy}</p>}
    {error && <p className="text-sm text-red-700" role="alert">{t(error)}</p>}
    {latitude.trim() && longitude.trim() && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude)) && Math.abs(Number(latitude)) <= 90 && Math.abs(Number(longitude)) <= 180 && <a className="text-sm underline" href={`https://www.openstreetmap.org/?mlat=${Number(latitude)}&mlon=${Number(longitude)}#map=17/${Number(latitude)}/${Number(longitude)}`} target="_blank" rel="noreferrer">{t("Check location on map")}</a>}
  </div>;
}
