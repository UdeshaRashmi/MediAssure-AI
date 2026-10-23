import { useEffect, useId, useMemo, useState } from "react";
import { Building2, Cross, Minus, Plus, RotateCcw, Search } from "lucide-react";
import { EmptyState, LoadingState } from "../components/ui";
import type { NetworkPharmacy } from "../types";
import { fetchLocationStock, type LocationStock } from "../services/api";
import { useI18n } from "../i18n";
import outline from "../data/sri-lanka.json";
import { isInMap, polygonPath, projectLocation } from "../mapGeometry";

const countryPath = polygonPath(outline.geometry.coordinates);

export function NetworkPage({ networkPharmacies }: { networkPharmacies: NetworkPharmacy[] }) {
  const { t, language } = useI18n();
  const uid = useId().replace(/:/g, "");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("All");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [stock, setStock] = useState<LocationStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const visible = useMemo(() => networkPharmacies.filter(row =>
    (kind === "All" || row.locationType === kind) && (!onlyOpen || row.status === "Online") &&
    `${row.name} ${row.area}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [networkPharmacies, kind, onlyOpen, query]);
  const mapped = visible.filter(row => isInMap(row.latitude, row.longitude));
  const selected = visible.find(row => row.id === selectedId) ?? null;
  const focus = zoom > 1 && selected && isInMap(selected.latitude, selected.longitude) ? projectLocation(selected.longitude!, selected.latitude!) : [270, 360];
  const width = 540 / zoom, height = 720 / zoom;

  useEffect(() => {
    if (!selected) { setStock([]); setError(""); setLoading(false); return; }
    let alive = true; setStock([]); setLoading(true); setError("");
    fetchLocationStock(selected.id).then(rows => { if (alive) setStock(rows); })
      .catch(error => { if (alive) setError(error.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [selected]);

  return <section className="overflow-hidden rounded-2xl border border-[#BFD9DB] bg-white shadow-sm">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-4 border-b p-4 sm:p-5"><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#0D8F93]">{t("Sri Lanka")}</p><h2 className="mt-2 text-xl font-bold sm:text-2xl">{t("Medicine availability atlas")}</h2><p className="mt-2 hidden max-w-xl text-sm text-[#557084] sm:block">{t("Explore the pharmacies and hospitals registered in this system. Select a pin to see available medicines.")}</p></div><div className="shrink-0 rounded-xl bg-[#E7F7F6] px-3 py-2 sm:px-4 sm:py-3"><strong className="text-2xl text-[#0D8F93]">{mapped.length}</strong><span className="ml-2 hidden text-sm sm:inline">{t("Mapped locations")}</span></div></div>
    <div className="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="relative min-w-0 bg-[#edf5f7]">
        <div className="relative z-10 m-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:m-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] rounded-xl border border-white bg-white/95 p-3 shadow-sm">
          <label className="col-span-2 flex min-h-11 min-w-0 items-center gap-2 sm:col-auto"><Search size={17} /><input className="min-w-0 w-full bg-transparent text-base outline-none" aria-label={t("Search location or address")} placeholder={t("Search location or address")} value={query} onChange={e => setQuery(e.target.value)} /></label>
          <select className="min-h-11 min-w-0 max-w-full rounded border p-2 text-base" aria-label={t("Location type")} value={kind} onChange={e => setKind(e.target.value)}>{["All", "Pharmacy", "Hospital"].map(value => <option key={value} value={value}>{t(value)}</option>)}</select>
          <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={onlyOpen} onChange={e => setOnlyOpen(e.target.checked)} />{t("Open only")}</label>
        </div>
        <svg viewBox={`${focus[0] - width / 2} ${focus[1] - height / 2} ${width} ${height}`} className="block h-[min(65svh,440px)] min-h-[280px] w-full sm:h-[560px]" role="group" aria-label={t("Sri Lanka medicine location map")}>
          <defs><pattern id={`${uid}-grid`} width="35" height="35" patternUnits="userSpaceOnUse"><path d="M 35 0 L 0 0 0 35" fill="none" stroke="#a6c7cf" strokeWidth=".5" opacity=".4" /></pattern><linearGradient id={`${uid}-land`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f9fdf9" /><stop offset="1" stopColor="#cfe9d9" /></linearGradient><filter id={`${uid}-shadow`}><feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0b5364" floodOpacity=".15" /></filter></defs>
          <rect x="-1000" y="-1000" width="2500" height="3000" fill={`url(#${uid}-grid)`} />
          <path d={countryPath} fill={`url(#${uid}-land)`} fillRule="evenodd" stroke="#739f98" strokeWidth="1.3" filter={`url(#${uid}-shadow)`} />
          {mapped.filter(row => row.id !== selected?.id).concat(selected && isInMap(selected.latitude, selected.longitude) ? [selected] : []).map(row => {
            const [x, y] = projectLocation(row.longitude!, row.latitude!);
            const active = row.id === selected?.id;
            const color = row.status !== "Online" ? "#64748b" : row.locationType === "Hospital" ? "#a54963" : "#0D8F93";
            return <g key={row.id} transform={`translate(${x}, ${y}) scale(${1 / zoom})`} role="button" tabIndex={0} aria-label={`${row.name}, ${t(row.locationType)}, ${t(row.status === "Online" ? "Open" : "Closed")}`} aria-pressed={active} onClick={() => setSelectedId(row.id)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedId(row.id); } }} className="cursor-pointer outline-none map-pin">
              <title>{row.name}</title>{active && <circle r="23" fill={color} opacity=".15" />}<path d="M0 6 C-4 0 -12 -7 -12 -15 A12 12 0 1 1 12 -15 C12 -7 4 0 0 6Z" fill={color} stroke="white" strokeWidth="2" /><path d="M-5 -15 H5 M0 -20 V-10" fill="none" stroke="white" strokeWidth="2" />
            </g>;
          })}
        </svg>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#BFD9DB] bg-white/90 p-3">
        <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-2 text-xs"><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#0D8F93]" />{t("Pharmacy")}</span><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#a54963]" />{t("Hospital")}</span><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-500" />{t("Closed")}</span></div>
          <div className="flex shrink-0 gap-1"><button className="secondary" aria-label={t("Zoom in")} disabled={zoom >= 4} onClick={() => setZoom(v => Math.min(4, v + 1))}><Plus size={17} /></button><button className="secondary" aria-label={t("Zoom out")} disabled={zoom <= 1} onClick={() => setZoom(v => Math.max(1, v - 1))}><Minus size={17} /></button><button className="secondary" aria-label={t("Reset map")} onClick={() => { setZoom(1); setSelectedId(null); }}><RotateCcw size={17} /></button></div>
        </div>
        <p className="bg-white/90 px-3 pb-3 text-xs text-[#557084]">{t("Country outline")}: <a className="underline" href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer">Natural Earth</a></p>
      </div>
      <aside className="min-w-0 border-t p-3 sm:p-4 xl:max-h-[860px] xl:overflow-y-auto xl:overscroll-contain xl:border-l xl:border-t-0">
        {selected ? <div className="mb-5 rounded-xl border bg-[#F8FCFC] p-4"><p className="text-xs font-bold text-[#0D8F93]">{t(selected.locationType)}</p><h3 className="mt-2 text-xl font-bold">{selected.name}</h3><p className="mt-2 text-sm">{selected.area}</p><p className="mt-2 text-sm">{t(selected.status === "Online" ? "Open" : "Closed")} - {t(selected.openUntil)}</p>{selected.phone && <a className="mt-2 block text-sm underline" href={`tel:${selected.phone}`}>{selected.phone}</a>}{isInMap(selected.latitude, selected.longitude) && <a className="mt-2 block text-sm underline" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${selected.latitude}&mlon=${selected.longitude}#map=17/${selected.latitude}/${selected.longitude}`}>{t("View location")}</a>}<h4 className="mt-5 font-bold">{t("Available medicines")}</h4>{loading && <LoadingState label="Loading data..." />}{error && <p role="alert" className="mt-2 text-sm text-red-700">{t(error)}</p>}{!loading && !error && !stock.length && <p className="mt-2 text-sm">{t("No available stock at this location.")}</p>}{stock.map(item => <div className="mt-3 rounded border bg-white p-3" key={item.id}><p className="font-bold">{item.medicine} {item.strength}</p><p className="text-sm">{t("Available stock")}: {item.available}</p><p className="mt-1 text-xs text-[#557084]">{t("Stock updated")}: {new Date(item.updated_at).toLocaleString(language === "si" ? "si-LK" : "en-LK")}</p></div>)}</div> : <p className="mb-4 rounded-xl bg-[#E7F7F6] p-4 text-sm">{t("Select a map pin or a location below.")}</p>}
        {!visible.length && <EmptyState title="No medicine locations yet" detail="No locations match the current filters." />}
        {visible.length > mapped.length && <p className="mb-3 text-sm text-amber-800">{t("Some locations have missing coordinates or lie outside this map area.")}</p>}
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">{visible.map(row => <button key={row.id} aria-pressed={row.id === selected?.id} className={`rounded-xl border p-3 text-left ${row.id === selected?.id ? "border-[#0D8F93] bg-[#E7F7F6]" : "bg-white hover:bg-[#F8FCFC]"}`} onClick={() => setSelectedId(row.id)}><span className="flex items-center gap-2 text-xs text-[#557084]">{row.locationType === "Hospital" ? <Building2 size={15} /> : <Cross size={15} />}{t(row.locationType)}</span><strong className="mt-1 block">{row.name}</strong><span className="mt-1 block text-xs">{row.area}</span></button>)}</div>
      </aside>
    </div>
  </section>;
}
