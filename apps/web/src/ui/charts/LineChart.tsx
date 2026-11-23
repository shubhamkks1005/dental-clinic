import { useState, type KeyboardEvent } from "react";
import { ChartDataTable } from "./ChartDataTable";
import { ChartFrame } from "./ChartFrame";
import { chartPointLabel, moveChartFocus } from "./chart-keys";
import { linePath, type ChartDatum } from "./chart-math";

type Props = {
  title: string;
  data: ChartDatum[];
  unit?: string;
  width?: number;
  height?: number;
};

export function LineChart({ title, data, unit = "", width = 320, height = 180 }: Props) {
  const layout = linePath(data, width, height);
  const [focus, setFocus] = useState(0);
  const active = layout.points[focus];
  const announce = active ? chartPointLabel(active.label, active.value, unit) : "";

  function onKey(e: KeyboardEvent) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    setFocus((i) => moveChartFocus(i, e.key, layout.points.length));
  }

  return (
    <ChartFrame
      title={title}
      announce={announce}
      table={
        <ChartDataTable
          caption={title}
          columns={[
            { key: "label", label: "Period" },
            { key: "value", label: unit || "Value" },
          ]}
          rows={data.map((x) => ({ label: x.label, value: x.value }))}
        />
      }
    >
      <svg
        className="chart-svg"
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        role="listbox"
        aria-label={title}
        tabIndex={0}
        onKeyDown={onKey}
      >
        <text x={4} y={20} className="chart-axis-label">
          {layout.max}
        </text>
        <path d={layout.d} fill="none" stroke="var(--blue)" strokeWidth="2.5" />
        {layout.points.map((p) => (
          <g key={p.label}>
            <circle
              cx={p.x}
              cy={p.y}
              r={p.index === focus ? 5 : 3.5}
              className={p.index === focus ? "chart-point chart-point-focus" : "chart-point"}
              role="option"
              aria-selected={p.index === focus}
              aria-label={chartPointLabel(p.label, p.value, unit)}
            />
            <text x={p.x} y={height - 8} textAnchor="middle" className="chart-tick">
              {p.label}
            </text>
            {p.index === focus ? (
              <text x={p.x} y={p.y - 10} textAnchor="middle" className="chart-value-label">
                {p.value}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
    </ChartFrame>
  );
}
