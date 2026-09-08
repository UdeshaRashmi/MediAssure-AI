import { Activity, AlertTriangle, BarChart3, BrainCircuit, TrendingDown, TrendingUp } from "lucide-react";
import { BarChart, EmptyState, Metric, Panel, ProgressBar, StatusBadge } from "../components/ui";
import type { DemandForecast } from "../types";

export function ForecastPage({ forecasts }: { forecasts: DemandForecast[] }) {
  const highestRisk = forecasts.length
    ? forecasts.reduce((top, item) => (item.stockoutRisk > top.stockoutRisk ? item : top), forecasts[0])
    : null;
  const projectedDemand = forecasts.reduce((sum, item) => sum + item.next24h, 0);

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<BrainCircuit size={20} />} label="Model confidence" value="91%" tone="teal" />
        <Metric icon={<AlertTriangle size={20} />} label="Highest risk" value={highestRisk ? `${highestRisk.stockoutRisk}%` : "0%"} tone="danger" />
        <Metric icon={<BarChart3 size={20} />} label="24h demand" value={projectedDemand.toString()} tone="navy" />
        <Metric icon={<Activity size={20} />} label="Signals watched" value="18" tone="amber" />
      </div>

      <Panel title="Medicine Demand Forecasts">
        <div className="grid gap-3">
          {forecasts.length === 0 && <EmptyState title="No forecasts" detail="Backend returned no demand forecast records." />}
          {forecasts.map((forecast) => (
            <article key={forecast.medicine} className="rounded-md border border-[#BFD9DB] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold">{forecast.medicine}</h3>
                    <StatusBadge label={forecast.trend} tone={forecast.trend === "Rising" ? "amber" : "teal"} />
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[#557084]">{forecast.driver}</p>
                </div>
                <TrendIcon trend={forecast.trend} />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1.4fr]">
                <ForecastMetric label="Next 24h" value={forecast.next24h.toString()} />
                <ForecastMetric label="Next 72h" value={forecast.next72h.toString()} />
                <div className="rounded-md bg-[#F8FCFC] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase text-[#557084]">Stock-out risk</p>
                    <p className="text-sm font-bold text-[#092C46]">{forecast.stockoutRisk}%</p>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={forecast.stockoutRisk} dangerAt={75} />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        {forecasts.length > 0 && (
          <>
            <BarChart
              data={forecasts.map((forecast) => ({ label: forecast.medicine, value: forecast.next24h }))}
              valueKey="Predicted 24h demand"
            />
            <BarChart
              data={forecasts.map((forecast) => ({ label: forecast.medicine, value: forecast.stockoutRisk }))}
              valueKey="Stock-out risk score"
              max={100}
              dangerAt={75}
            />
          </>
        )}
      </div>

      <Panel title="Suggested Model Actions">
        <div className="grid gap-3 lg:grid-cols-3">
          <ActionCard title="Reorder threshold" detail="Raise Salbutamol reorder level from 12 to 18 for the next 7 days." />
          <ActionCard title="Transfer trigger" detail="Create an automatic review when any rescue score drops below 80%." />
          <ActionCard title="Explainability" detail="Surface top demand drivers before a pharmacist approves stock movement." />
        </div>
      </Panel>
    </div>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  const icon = trend === "Falling" ? <TrendingDown size={20} /> : <TrendingUp size={20} />;
  const color = trend === "Rising" ? "bg-[#FFF4D8] text-[#A66B00]" : "bg-[#E7F7F6] text-[#0D8F93]";
  return <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${color}`}>{icon}</div>;
}

function ForecastMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[#F8FCFC] p-3">
      <p className="text-xs font-bold uppercase text-[#557084]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#092C46]">{value}</p>
    </div>
  );
}

function ActionCard({ title, detail }: { title: string; detail: string }) {
  return (
    <article className="rounded-md border border-[#BFD9DB] bg-white p-4">
      <h3 className="font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#557084]">{detail}</p>
    </article>
  );
}
