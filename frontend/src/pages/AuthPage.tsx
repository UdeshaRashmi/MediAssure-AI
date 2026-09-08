import { useState, type FormEvent } from "react";
import { LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import logo1 from "../logo1-transparent-tight.png";
import { loginWithApi } from "../services/api";
import type { SessionUser } from "../types";

const roles: SessionUser["role"][] = ["Pharmacist", "Hospital Staff", "Patient", "Admin"];

export function AuthPage({ onLogin }: { onLogin: (user: SessionUser) => void }) {
  const [role, setRole] = useState<SessionUser["role"]>("Pharmacist");
  const [email, setEmail] = useState("pharmacist@mediassure.local");
  const [authMode, setAuthMode] = useState<"ready" | "checking" | "offline">("ready");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthMode("checking");

    try {
      const user = await loginWithApi(email, "demo-password", role);
      onLogin(user);
    } catch {
      setAuthMode("offline");
      onLogin({
        name: role === "Patient" ? "Emergency User" : "City Care Operator",
        email,
        role,
      });
    }
  };

  return (
    <main className="min-h-screen bg-[#F2F7F7] px-4 py-8 text-[#092C46]">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1fr_420px]">
        <section>
          <img src={logo1} alt="MediAssure" className="h-28 w-28 object-contain" />
          <p className="mt-5 text-sm font-bold uppercase text-[#0D8F93]">MediAssure AI</p>
          <h1 className="mt-2 max-w-3xl text-4xl font-bold leading-tight text-[#092C46] sm:text-5xl">
            Emergency medicine availability with predictive pharmacy coordination
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#557084]">
            Sign in to access medicine matching, pharmacy inventory, reservations, forecasting, and network monitoring.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <TrustPoint title="Verified stock" detail="Pharmacist confirmed inventory" />
            <TrustPoint title="Safety boundary" detail="No automatic prescribing" />
            <TrustPoint title="Live routing" detail="ETA-aware recommendations" />
          </div>
        </section>

        <form onSubmit={handleSubmit} className="rounded-lg border border-[#BFD9DB] bg-white p-5 shadow-sm">
          <div className="grid h-12 w-12 place-items-center rounded-md bg-[#E7F7F6] text-[#0D8F93]">
            <ShieldCheck size={24} />
          </div>
          <h2 className="mt-4 text-2xl font-bold">Secure sign in</h2>
          <p className="mt-1 text-sm text-[#557084]">
            {authMode === "offline" ? "Backend unavailable, continuing with local demo session." : "Demo authentication for the research prototype."}
          </p>

          <label className="mt-5 block">
            <span className="flex items-center gap-2 text-xs font-bold uppercase text-[#557084]">
              <Mail size={15} />
              Email
            </span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-md border border-[#BFD9DB] bg-[#F8FCFC] px-3 py-3 outline-none"
              type="email"
              required
            />
          </label>

          <label className="mt-4 block">
            <span className="flex items-center gap-2 text-xs font-bold uppercase text-[#557084]">
              <LockKeyhole size={15} />
              Password
            </span>
            <input
              className="mt-2 w-full rounded-md border border-[#BFD9DB] bg-[#F8FCFC] px-3 py-3 outline-none"
              type="password"
              value="demo-password"
              readOnly
            />
          </label>

          <div className="mt-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase text-[#557084]">
              <UserRound size={15} />
              Role
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {roles.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setRole(item)}
                  className={`h-10 rounded-md border px-3 text-sm font-bold ${
                    role === item ? "border-[#0D8F93] bg-[#E7F7F6] text-[#0D8F93]" : "border-[#BFD9DB] text-[#31556A]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <button className="mt-5 h-11 w-full rounded-md bg-[#092C46] text-sm font-bold text-white">
            {authMode === "checking" ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}

function TrustPoint({ title, detail }: { title: string; detail: string }) {
  return (
    <article className="rounded-md border border-[#BFD9DB] bg-white p-4">
      <h3 className="font-bold">{title}</h3>
      <p className="mt-1 text-sm text-[#557084]">{detail}</p>
    </article>
  );
}
