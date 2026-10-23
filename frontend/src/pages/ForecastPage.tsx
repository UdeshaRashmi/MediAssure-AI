import { EmptyState } from "../components/ui";
import type { DemandForecast } from "../types";
export function ForecastPage(_props: { forecasts: DemandForecast[] }) { return <EmptyState title="No forecasts available" detail="Demand forecasting requires recorded sales history and a validated prediction model. No sample predictions are shown." />; }
