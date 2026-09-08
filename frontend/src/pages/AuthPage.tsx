import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import logo1 from "../logo1-transparent-tight.png";
import { loginWithApi, signupWithApi } from "../services/api";
import type { SessionUser } from "../types";

const roles: SessionUser["role"][] = ["Pharmacist", "Hospital Staff", "Patient", "Admin"];

const roleDetails: Record<SessionUser["role"], { description: string }> = {
  Pharmacist: {
    description: "Inventory, reservations, forecasting, and stock transfers",
  },
  "Hospital Staff": {
    description: "Emergency requests, pharmacy matching, and patient coordination",
  },
  Patient: {
    description: "Find medicine, create requests, and track reservations",
  },
  Admin: {
    description: "System monitoring, network oversight, and governance controls",
  },
};

export function AuthPage({ onLogin }: { onLogin: (user: SessionUser) => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<SessionUser["role"]>("Pharmacist");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<"ready" | "checking" | "error">("ready");
  const [authError, setAuthError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError("");

    if (mode === "signup" && password !== confirmPassword) {
      setAuthMode("error");
      setAuthError("Passwords do not match.");
      return;
    }

    setAuthMode("checking");

    try {
      const user =
        mode === "signin"
          ? await loginWithApi(email, password, role)
          : await signupWithApi({
              email,
              name,
              password,
              phone,
              role,
            });
      onLogin(user);
    } catch {
      setAuthMode("error");
      setAuthError("Backend authentication failed. Check the API server and credentials.");
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
          <h2 className="mt-4 text-2xl font-bold">{mode === "signin" ? "Secure sign in" : "Create account"}</h2>
          <p className="mt-1 text-sm text-[#557084]">
            {authMode === "error"
              ? authError
              : mode === "signin"
                ? "Sign in with your email, password, and selected role."
                : "Create a role-based workspace for the prototype."}
          </p>

          <div className="mt-5 grid grid-cols-2 rounded-md border border-[#BFD9DB] bg-[#F8FCFC] p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`h-10 rounded-md text-sm font-bold ${mode === "signin" ? "bg-white text-[#0D8F93] shadow-sm" : "text-[#31556A]"}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`h-10 rounded-md text-sm font-bold ${mode === "signup" ? "bg-white text-[#0D8F93] shadow-sm" : "text-[#31556A]"}`}
            >
              Sign up
            </button>
          </div>

          {mode === "signup" && (
            <>
              <label className="mt-5 block">
                <span className="flex items-center gap-2 text-xs font-bold uppercase text-[#557084]">
                  <UserRound size={15} />
                  Full name
                </span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 w-full rounded-md border border-[#BFD9DB] bg-[#F8FCFC] px-3 py-3 outline-none"
                  required
                />
              </label>

              <label className="mt-4 block">
                <span className="flex items-center gap-2 text-xs font-bold uppercase text-[#557084]">
                  <Phone size={15} />
                  Phone
                </span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="mt-2 w-full rounded-md border border-[#BFD9DB] bg-[#F8FCFC] px-3 py-3 outline-none"
                  type="tel"
                />
              </label>
            </>
          )}

          <label className={`${mode === "signup" ? "mt-4" : "mt-5"} block`}>
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
            <div className="mt-2 flex rounded-md border border-[#BFD9DB] bg-[#F8FCFC]">
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="min-w-0 flex-1 bg-transparent px-3 py-3 outline-none"
                type={showPassword ? "text" : "password"}
                minLength={6}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                title={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((visible) => !visible)}
                className="grid w-11 place-items-center text-[#31556A]"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>

          {mode === "signup" && (
            <label className="mt-4 block">
              <span className="flex items-center gap-2 text-xs font-bold uppercase text-[#557084]">
                <LockKeyhole size={15} />
                Confirm password
              </span>
              <input
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-2 w-full rounded-md border border-[#BFD9DB] bg-[#F8FCFC] px-3 py-3 outline-none"
                type={showPassword ? "text" : "password"}
                minLength={6}
                placeholder="Re-enter your password"
                required
              />
            </label>
          )}

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
                  onClick={() => {
                    setRole(item);
                  }}
                  className={`min-h-[72px] rounded-md border px-3 py-3 text-left text-sm transition ${
                    role === item ? "border-[#0D8F93] bg-[#E7F7F6] text-[#0D8F93]" : "border-[#BFD9DB] text-[#31556A]"
                  }`}
                >
                  <span className="block font-bold">{item}</span>
                  <span className="mt-1 block text-xs leading-4 text-[#557084]">{roleDetails[item].description}</span>
                </button>
              ))}
            </div>
          </div>

          <button className="mt-5 h-11 w-full rounded-md bg-[#092C46] text-sm font-bold text-white">
            {authMode === "checking" ? (mode === "signin" ? "Signing in..." : "Creating account...") : mode === "signin" ? "Sign in" : "Create account"}
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
