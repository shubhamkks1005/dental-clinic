import type { DashboardRangePreset } from "@clinic/shared";
import { Checkbox, TextInput } from "../../ui/form";

const PRESETS: { id: DashboardRangePreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "this_month", label: "This month" },
  { id: "last_month", label: "Last month" },
  { id: "12m", label: "12 months" },
  { id: "custom", label: "Custom" },
];

type Props = {
  range: DashboardRangePreset;
  from: string;
  to: string;
  compare: boolean;
  onRange: (r: DashboardRangePreset) => void;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  onCompare: (v: boolean) => void;
};

/** 6.3.4: period chips + optional custom dates + compare previous. */
export function RangeControls({
  range,
  from,
  to,
  compare,
  onRange,
  onFrom,
  onTo,
  onCompare,
}: Props) {
  return (
    <div className="dash-range">
      <div className="dash-range-chips" role="group" aria-label="Report range">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={
              range === p.id ? "btn dash-chip dash-chip-on" : "btn btn-secondary dash-chip"
            }
            aria-pressed={range === p.id}
            onClick={() => onRange(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
      {range === "custom" ? (
        <div className="dash-range-custom">
          <label>
            From
            <TextInput
              className="input"
              type="date"
              value={from}
              onChange={(e) => onFrom(e.target.value)}
            />
          </label>
          <label>
            To
            <TextInput
              className="input"
              type="date"
              value={to}
              onChange={(e) => onTo(e.target.value)}
            />
          </label>
        </div>
      ) : null}
      <label className="dash-compare">
        <Checkbox checked={compare} onChange={(e) => onCompare(e.target.checked)} />
        Compare with previous period
      </label>
    </div>
  );
}
