import React from "react";
import ReactDOM from "react-dom/client";
import { AlertTriangle, MapPin, Search, ShieldCheck } from "lucide-react";
import "./styles.css";

function App() {
  return (
    <main className="min-h-screen bg-[#F8FAF7] text-[#26332B]">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <nav className="flex items-center justify-between border-b border-[#DDE6DF] pb-5">
          <div>
            <p className="text-sm font-medium text-[#5F7D68]">MediAssure AI</p>
            <h1 className="text-2xl font-semibold">Emergency medicine access</h1>
          </div>
          <button className="inline-flex items-center gap-2 rounded-md bg-[#C95F5F] px-4 py-2 text-sm font-semibold text-white">
            <AlertTriangle size={16} />
            Emergency
          </button>
        </nav>

        <div className="grid flex-1 gap-6 py-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="flex flex-col justify-center">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-semibold leading-tight">
                Find the pharmacy most likely to have your medicine when you arrive.
              </h2>
              <p className="mt-4 text-lg text-[#6F7D73]">
                Availability-aware ranking combines stock, freshness, travel time,
                urgency, and predicted demand.
              </p>

              <div className="mt-8 flex max-w-xl items-center gap-3 rounded-md border border-[#DDE6DF] bg-white p-2">
                <Search className="ml-2 text-[#5F7D68]" size={20} />
                <input
                  className="min-w-0 flex-1 bg-transparent px-1 py-3 outline-none"
                  placeholder="Search medicine"
                />
                <button className="rounded-md bg-[#5F7D68] px-4 py-3 text-sm font-semibold text-white">
                  Search
                </button>
              </div>
            </div>
          </section>

          <section className="grid content-center gap-4">
            <article className="rounded-md border border-[#DDE6DF] bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">City Care Pharmacy</h3>
                  <p className="mt-1 text-sm text-[#6F7D73]">2.5 km · 9 min ETA</p>
                </div>
                <span className="rounded-md bg-[#E7F1EA] px-3 py-1 text-sm font-semibold text-[#4F8A64]">
                  95%
                </span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-[#6F7D73]">Stock</p>
                  <p className="font-semibold">10 units</p>
                </div>
                <div>
                  <p className="text-[#6F7D73]">Score</p>
                  <p className="font-semibold">91</p>
                </div>
                <div>
                  <p className="text-[#6F7D73]">Status</p>
                  <p className="font-semibold">Open</p>
                </div>
              </div>
            </article>

            <article className="rounded-md border border-[#DDE6DF] bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Nearest Meds</h3>
                  <p className="mt-1 text-sm text-[#6F7D73]">1.0 km · 5 min ETA</p>
                </div>
                <span className="rounded-md bg-[#FFF5DA] px-3 py-1 text-sm font-semibold text-[#9A6A12]">
                  30%
                </span>
              </div>
              <div className="mt-5 flex items-center gap-2 text-sm text-[#6F7D73]">
                <MapPin size={16} />
                Closer, but high stock-out risk
              </div>
            </article>

            <div className="flex items-center gap-3 rounded-md border border-[#C9D8CC] bg-[#E7F1EA] p-4 text-sm text-[#36543F]">
              <ShieldCheck size={20} />
              Pharmacist verification required for alternatives and reservations.
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

