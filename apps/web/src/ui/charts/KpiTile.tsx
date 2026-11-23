import type { ReactNode } from "react";

type Props = {
  label: string;
  value: string;
  /** Always include the raw change, not % alone (6.3.5 will refine). */
  note: ReactNode;
  tone?: "up" | "down" | "flat" | "thin";
};

export function KpiTile({ label, value, note, tone = "flat" }: Props) {
  return (
    <section className={`kpi-tile card kpi-tile-${tone}`}>
      <p className="kpi-tile-label">{label}</p>
      <p className="kpi-tile-value">{value}</p>
      <p className="kpi-tile-note">{note}</p>
    </section>
  );
}
