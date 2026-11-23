import { useState, type KeyboardEvent } from "react";
import { ChartDataTable } from "./ChartDataTable";
import { ChartFrame } from "./ChartFrame";
import { chartPointLabel, moveChartFocus } from "./chart-keys";
import { barLayout, type ChartDatum } from "./chart-math";

type Props = {
  title: string;
  data: ChartDatum[];
  unit?: string;
  width?: number;
  height?: number;
};

export function BarChart({ title, data, unit = "", width = 320, height = 180 }: Props) {
  const { bars, max, pad, innerH } = barLayout(data, width, height);
  const [focus, setFocus] = useState(0);
  const active = bars[focus];
  const announce = active ? chartPointLabel(active.label, active.value, unit) : "";

  function onKey(e: KeyboardEvent) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) {
      return;
    }
    e.preventDefault();
    setFocus((i) => moveChartFocus(i, e.key, bars.length));
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
          rows={data.map((d) => ({ label: d.label, value: d.value }))}
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
        <text x={4} y={pad.top + 4} className="chart-axis-label">
          {max}
        </text>
        <line
          x1={pad.left}
          y1={pad.top + innerH}
          x2={width - pad.right}
          y2={pad.top + innerH}
          className="chart-axis"
        />
        {bars.map((b) => (
          <g key={b.label}>
            <rect
              x={b.x}
              y={b.y}
              width={b.width}
              height={Math.max(b.height, 0)}
              className={b.index === focus ? "chart-bar chart-bar-focus" : "chart-bar"}
              role="option"
              aria-selected={b.index === focus}
              aria-label={chartPointLabel(b.label, b.value, unit)}
            />
            <text x={b.x + b.width / 2} y={height - 8} textAnchor="middle" className="chart-tick">
              {b.label}
            </text>
            {b.index === focus ? (
              <text
                x={b.x + b.width / 2}
                y={b.y - 4}
                textAnchor="middle"
                className="chart-value-label"
              >
                {b.value}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
    </ChartFrame>
  );
}
