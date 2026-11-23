import { useState, type KeyboardEvent } from "react";
import { ChartDataTable } from "./ChartDataTable";
import { ChartFrame } from "./ChartFrame";
import { chartPointLabel, moveChartFocus } from "./chart-keys";
import { heatGrid, type HeatCell } from "./chart-math";

type Props = {
  title: string;
  cells: HeatCell[];
  width?: number;
  height?: number;
};

export function Heatmap({ title, cells, width = 320, height = 200 }: Props) {
  const { rows, cols, max, matrix } = heatGrid(cells);
  const flat = rows.flatMap((r, ri) =>
    cols.map((c, ci) => ({
      row: r,
      col: c,
      value: matrix[ri]![ci]!,
      index: ri * cols.length + ci,
    })),
  );
  const [focus, setFocus] = useState(0);
  const active = flat[focus];
  const announce = active ? chartPointLabel(`${active.row} ${active.col}`, active.value) : "";

  const pad = { top: 28, right: 8, bottom: 8, left: 48 };
  const cellW = (width - pad.left - pad.right) / Math.max(cols.length, 1);
  const cellH = (height - pad.top - pad.bottom) / Math.max(rows.length, 1);

  function onKey(e: KeyboardEvent) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) {
      return;
    }
    e.preventDefault();
    setFocus((i) => moveChartFocus(i, e.key, flat.length, cols.length));
  }

  return (
    <ChartFrame
      title={title}
      announce={announce}
      table={
        <ChartDataTable
          caption={title}
          columns={[
            { key: "row", label: "Day" },
            { key: "col", label: "Hour" },
            { key: "value", label: "Arrived" },
          ]}
          rows={flat.map((c) => ({ row: c.row, col: c.col, value: c.value }))}
        />
      }
    >
      <svg
        className="chart-svg"
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        role="grid"
        aria-label={title}
        tabIndex={0}
        onKeyDown={onKey}
      >
        {cols.map((c, ci) => (
          <text
            key={c}
            x={pad.left + ci * cellW + cellW / 2}
            y={16}
            textAnchor="middle"
            className="chart-tick"
          >
            {c}
          </text>
        ))}
        {rows.map((r, ri) => (
          <g key={r}>
            <text
              x={pad.left - 6}
              y={pad.top + ri * cellH + cellH / 2 + 4}
              textAnchor="end"
              className="chart-tick"
            >
              {r}
            </text>
            {cols.map((c, ci) => {
              const value = matrix[ri]![ci]!;
              const index = ri * cols.length + ci;
              const intensity = max === 0 ? 0 : value / max;
              return (
                <g key={`${r}-${c}`}>
                  <rect
                    x={pad.left + ci * cellW + 1}
                    y={pad.top + ri * cellH + 1}
                    width={Math.max(cellW - 2, 1)}
                    height={Math.max(cellH - 2, 1)}
                    className={index === focus ? "chart-heat chart-heat-focus" : "chart-heat"}
                    fill={`color-mix(in srgb, var(--blue) ${Math.round(intensity * 100)}%, var(--blue-soft))`}
                    role="gridcell"
                    aria-selected={index === focus}
                    aria-label={chartPointLabel(`${r} ${c}`, value)}
                  />
                  {value > 0 ? (
                    <text
                      x={pad.left + ci * cellW + cellW / 2}
                      y={pad.top + ri * cellH + cellH / 2 + 4}
                      textAnchor="middle"
                      className="chart-heat-label"
                    >
                      {value}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </g>
        ))}
      </svg>
    </ChartFrame>
  );
}
