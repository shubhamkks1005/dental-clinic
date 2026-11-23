import { formatMoney, istDate, plural } from "@clinic/shared";
import { useEffect, useState } from "react";
import { EmptyState } from "../../ui/page/EmptyState";
import { getDayClose, type DayCloseSummary } from "./api";

const MODE_LABEL: Record<string, string> = { cash: "Cash", upi: "UPI", card: "Card" };

// Billing > Today: what was collected today, by mode. Built from the Dues cards (no design file).
export function TodayTab() {
  const [summary, setSummary] = useState<DayCloseSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    getDayClose(istDate(new Date()))
      .then(setSummary)
      .catch(() => setError("Could not load today's collection. Check the connection."));
  }, []);

  if (error) return <p className="field-error">{error}</p>;
  if (!summary) return <p className="muted">Loading…</p>;
  const modes = Object.entries(summary.modeTotals).filter(([, paise]) => paise > 0);
  return (
    <div className="hub-stack">
      <div className="ageing">
        <section className="card ageing-card ageing-total">
          <p>Collected today</p>
          <p className="ageing-value">{formatMoney(summary.totalPaise)}</p>
          <p className="small">{plural(summary.paymentCount, "payment")}</p>
        </section>
        {modes.map(([mode, paise]) => (
          <section key={mode} className="card ageing-card">
            <p className="muted">{MODE_LABEL[mode] ?? mode}</p>
            <p className="ageing-value">{formatMoney(paise)}</p>
          </section>
        ))}
      </div>
      {summary.paymentCount === 0 ? (
        <EmptyState>No payments recorded yet today.</EmptyState>
      ) : (
        <p className="muted">
          The full list of payments is on each bill and on the patient&apos;s Billing tab.
        </p>
      )}
    </div>
  );
}
