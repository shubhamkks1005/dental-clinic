import { formatRupees, growthNote, growthView } from "@clinic/shared";
import type { DashboardKpis as Kpis } from "@clinic/shared";
import { KpiTile } from "../../ui/charts";

type Props = { kpis: Kpis };

/** DRAFT top-4 KPIs (6.3.3 / 6.3.5 growth notes). */
export function DashboardKpis({ kpis }: Props) {
  const arrived = growthView(kpis.todayArrived, kpis.prevTodayArrived);
  const neu = growthView(kpis.monthNew, kpis.prevMonthNew);
  const collectedNote = moneyNote(kpis.monthCollectedPaise, kpis.prevMonthCollectedPaise);

  return (
    <div className="dash-kpis">
      <KpiTile
        label="Arrived today"
        value={String(kpis.todayArrived)}
        note={growthNote(arrived, "patients")}
        tone={tileTone(arrived.kind)}
      />
      <KpiTile
        label="New this month"
        value={String(kpis.monthNew)}
        note={growthNote(neu, "patients")}
        tone={tileTone(neu.kind)}
      />
      <KpiTile
        label="Payments this month"
        value={formatRupees(kpis.monthPaymentsPaise)}
        note={`Refunds ${formatRupees(kpis.monthRefundsPaise)}. Net ${formatRupees(kpis.monthCollectedPaise)}: ${collectedNote.text}`}
        tone={collectedNote.tone}
      />
      <KpiTile
        label="Outstanding"
        value={formatRupees(kpis.outstandingPaise)}
        note="Open issued bills minus payments"
        tone="flat"
      />
    </div>
  );
}

function tileTone(kind: string): "up" | "down" | "flat" | "thin" {
  if (kind === "up" || kind === "down" || kind === "thin" || kind === "flat") return kind;
  return "flat";
}

function moneyNote(
  current: number,
  previous: number,
): { text: string; tone: "up" | "down" | "flat" } {
  const delta = current - previous;
  if (delta === 0) {
    return { text: `Same as last month (${formatRupees(current)})`, tone: "flat" };
  }
  const sign = delta > 0 ? "+" : "";
  const pct = previous === 0 ? 100 : Math.round((delta / previous) * 100);
  return {
    text: `${sign}${formatRupees(delta)} (${sign}${pct}%) vs ${formatRupees(previous)}`,
    tone: delta > 0 ? "up" : "down",
  };
}
