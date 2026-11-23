import { useState, type KeyboardEvent } from "react";
import { ChartDataTable } from "./ChartDataTable";
import { ChartFrame } from "./ChartFrame";
import { chartPointLabel, moveChartFocus } from "./chart-keys";
import { CHART_SERIES, stackedLayout, type StackedDatum } from "./chart-math";

type Props = {
  title: string;
  data: StackedDatum[];
  keys: { key: string; label: string }[];
  width?: number;
  height?: number;
};

export function StackedBarChart({ title, data, keys, width = 320, height = 180 }: Props) {
  const keyIds = keys.map((k) => k.key);
  const { columns, pad } = stackedLayout(data, keyIds, width, height);
  const [focus, setFocus] = useState(0);
  const col = columns[focus];
  const announce = col
    ? `${col.label}: ${col.segments.map((s) => `${s.key} ${s.value}`).join(", ")}`
    : "";

  function onKey(e: KeyboardEvent) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    setFocus((i) => moveChartFocus(i, e.key, columns.length));
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
            ...keys.map((k) => ({ key: k.key, label: k.label })),
          ]}
          rows={data.map((d) => {
            const row: Record<string, string | number> = { label: d.label };
            for (const k of keys) {
              row[k.key] = d.parts.find((p) => p.key === k.key)?.value ?? 0;
            }
            return row;
          })}
        />
      }
    >
      <ul className="chart-legend" aria-label="Series">
        {keys.map((k, i) => (
          <li key={k.key}>
            <span
              className={`chart-swatch chart-swatch-${CHART_SERIES[i % CHART_SERIES.length]!.pattern}`}
              style={{ background: CHART_SERIES[i % CHART_SERIES.length]!.css }}
              aria-hidden
            />
            {k.label}
          </li>
        ))}
      </ul>
      <svg
        className="chart-svg"
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        role="listbox"
        aria-label={title}
        tabIndex={0}
        onKeyDown={onKey}
      >
        {columns.map((c) => {
          const first = c.segments[0];
          const midX = first ? first.x + first.width / 2 : 0;
          return (
            <g key={c.label}>
              {c.segments.map((s, si) => {
                const series = CHART_SERIES[si % CHART_SERIES.length]!;
                return (
                  <rect
                    key={s.key}
                    x={s.x}
                    y={s.y}
                    width={s.width}
                    height={Math.max(s.height, 0)}
                    fill={series.css}
                    className={c.index === focus ? "chart-bar-focus-stroke" : undefined}
                    role="option"
                    aria-selected={c.index === focus}
                    aria-label={chartPointLabel(`${c.label} ${s.key}`, s.value)}
                  />
                );
              })}
              <text x={midX} y={height - 8} textAnchor="middle" className="chart-tick">
                {c.label}
              </text>
            </g>
          );
        })}
        <line
          x1={pad.left}
          y1={height - pad.bottom}
          x2={width - pad.right}
          y2={height - pad.bottom}
          className="chart-axis"
        />
      </svg>
    </ChartFrame>
  );
}
