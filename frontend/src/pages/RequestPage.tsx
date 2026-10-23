import { FinderPage } from "./FinderPage";
import type { PharmacyMatch } from "../types";
import { useI18n } from "../i18n";
export function RequestPage(props: { matches: PharmacyMatch[]; loading: boolean; quantity: number; onChanged: () => void }) {
  const { t } = useI18n();
  return <div className="grid gap-4"><p>{t("Search for the medicine you need using the form above, then submit a reservation to an open pharmacy.")}</p><FinderPage {...props} /></div>;
}
