import { useSearchParams } from "react-router";
import { PageHeader } from "../../ui/page/Page";
import { Tabs } from "../../ui/Tabs";
import { BillsTab } from "./BillsTab";
import { DayCloseTab } from "./DayCloseTab";
import { DuesTab } from "./DuesTab";
import { TodayTab } from "./TodayTab";
import "./billing-hub.css";

const TABS = ["today", "dues", "bills", "close"] as const;
type HubTab = (typeof TABS)[number];

// Billing hub (Billing.dc.html, PhoneBilling.dc.html): Today, Dues, Bills, Day close.
// The open tab is in the address (?tab=bills), so a reload or a link keeps it.
export function BillingHomeScreen() {
  const [params, setParams] = useSearchParams();
  const asked = params.get("tab");
  const tab: HubTab = TABS.find((t) => t === asked) ?? "dues";

  return (
    <section aria-label="Billing" className="hub">
      <PageHeader title="Billing" subtitle="Who owes money, what was bought, and today's cash." />
      <Tabs
        label="Billing sections"
        value={tab}
        onChange={(id) => setParams({ tab: id }, { replace: true })}
        tabs={[
          { id: "today", label: "Today", content: <TodayTab /> },
          { id: "dues", label: "Dues", content: <DuesTab /> },
          { id: "bills", label: "Bills", content: <BillsTab /> },
          { id: "close", label: "Day close", content: <DayCloseTab /> },
        ]}
      />
    </section>
  );
}
