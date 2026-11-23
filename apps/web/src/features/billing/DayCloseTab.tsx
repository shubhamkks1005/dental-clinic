import { DailyClosePanel } from "./DailyClosePanel";

// Billing > Day close: its own tab (no design file; built from the Dues cards).
export function DayCloseTab() {
  return (
    <div className="hub-stack">
      <div className="card close-card">
        <DailyClosePanel />
      </div>
    </div>
  );
}
