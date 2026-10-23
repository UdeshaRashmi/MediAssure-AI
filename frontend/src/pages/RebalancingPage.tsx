import { EmptyState } from "../components/ui";
import type { TransferSuggestion } from "../types";
export function RebalancingPage(_props: { transfers: TransferSuggestion[] }) { return <EmptyState title="No transfer suggestions" detail="Stock transfers are not enabled yet. No sample suggestions are shown." />; }
