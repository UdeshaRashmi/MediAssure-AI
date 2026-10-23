import { ValidatedForm, ValidatedInput } from "../components/ValidatedForm";
import { useState, type FormEvent } from "react";
import logo from "../logo1-transparent-tight.png";
import { loginWithApi, signupWithApi } from "../services/api";
import type { SessionUser } from "../types";
import { LanguageSwitch, useI18n } from "../i18n";
const roles: SessionUser["role"][] = ["Patient", "Pharmacist", "Hospital Staff", "Admin"];
export function AuthPage({ onLogin }: { onLogin: (user: SessionUser) => void }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<SessionUser["role"]>("Patient");
  const [email, setEmail] = useState(""); const [name, setName] = useState(""); const [phone, setPhone] = useState("");
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (mode === "signup" && password !== confirm) { setError("Passwords do not match."); return; }
    setBusy(true);
    try { onLogin(mode === "signin" ? await loginWithApi(email, password, role) : await signupWithApi({ email, name, phone, password, role })); }
    catch (error) { setError(error instanceof Error ? error.message : "Request failed. Please try again."); }
    finally { setBusy(false); }
  }
  const details: Record<SessionUser["role"], string> = { Patient: "Find medicines and manage your reservations", Pharmacist: "Manage your pharmacy inventory and patient pickups", "Hospital Staff": "Manage hospital stock, find medicines, and coordinate reservations", Admin: "Review staff accounts and oversee the pharmacy network" };
  return <main className="min-h-screen bg-[#F2F7F7] px-3 py-4 sm:px-6 sm:py-6 text-[#092C46]"><div className="mx-auto flex max-w-6xl justify-end"><LanguageSwitch /></div><div className="mx-auto grid max-w-6xl min-w-0 items-center gap-6 py-5 sm:gap-8 sm:py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><section className="min-w-0"><img src={logo} alt="MediAssure" className="h-16 w-16 sm:h-28 sm:w-28 object-contain" /><h1 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">{t("Medicine availability, connected to your community")}</h1><p className="mt-4">{t("Use your own pharmacy stock and reservations. No sample records or automatic prescriptions.")}</p></section>
    <ValidatedForm key={mode} onSubmit={submit} className="grid min-w-0 gap-4 rounded-xl border bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-2xl font-bold">{t(mode === "signin" ? "Sign in" : "Create account")}</h2>
      <div className="grid grid-cols-2 gap-2"><button className={mode === "signin" ? "action" : "secondary"} type="button" onClick={() => { setMode("signin"); setError(""); }}>{t("Sign in")}</button><button className={mode === "signup" ? "action" : "secondary"} type="button" onClick={() => { setMode("signup"); if (role === "Admin") setRole("Patient"); setError(""); }}>{t("Sign up")}</button></div>
      <label>{t("Role")}<select className="field" value={role} onChange={e => setRole(e.target.value as SessionUser["role"])}>{roles.filter(r => mode === "signin" || r !== "Admin").map(r => <option key={r} value={r}>{t(r)}</option>)}</select></label><p className="text-sm">{t(details[role])}</p>
      {mode === "signup" && <><label>{t("Full name")}<ValidatedInput className="field" name="name" value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={120} autoComplete="name" required /></label><label>{t("Phone")}<ValidatedInput className="field" name="phone" value={phone} onChange={e => setPhone(e.target.value)} maxLength={32} type="tel" autoComplete="tel" /></label></>}
      <label>{t("Email")}<ValidatedInput className="field" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" maxLength={255} required /></label>
      <label>{t("Password")}<ValidatedInput className="field" name="password" data-password="true" type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={6} maxLength={1024} required /></label>
      {mode === "signup" && <label>{t("Confirm password")}<ValidatedInput className="field" name="confirm_password" data-password="true" type={show ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" minLength={6} maxLength={1024} required /></label>}
      <label className="flex items-center gap-2"><ValidatedInput type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} />{t("Show password")}</label>
      {mode === "signup" && role !== "Patient" && <p>{t("Staff accounts require administrator approval before access is granted.")}</p>}
      {error && <p className="text-red-700" role="alert">{t(error)}</p>}<button className="action" disabled={busy}>{t(busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account")}</button>
    </ValidatedForm></div></main>;
}
