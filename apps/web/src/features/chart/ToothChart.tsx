import type { ChartCell, FdiTooth, ToothSurface } from "@clinic/shared";
import { useEffect, useId, useState } from "react";
import { initialFocus, moveFocus, type ChartFocus } from "./chart-keyboard";
import { rowsForDentition, type ChartDentition } from "./chart-layout";
import { ToothGlyph } from "./ToothGlyph";
import "./chart.css";

export type ToothChartProps = {
  dentition?: ChartDentition;
  cells?: ChartCell[];
  /** Condition applied when the doctor presses Enter on a focused surface (3.4.2). */
  applyCondition?: string;
  onApply?: (tooth: FdiTooth, surface: ToothSurface, conditionCode: string) => void;
  legend?: { code: string; label: string; color?: string }[];
};

export function ToothChart({
  dentition = "permanent",
  cells = [],
  applyCondition = "filling",
  onApply,
  legend = [{ code: "filling", label: "Filling" }],
}: ToothChartProps) {
  const labelId = useId();
  const [focus, setFocus] = useState<ChartFocus>(() => initialFocus(dentition));

  useEffect(() => {
    setFocus(initialFocus(dentition));
  }, [dentition]);

  function handleKeyDown(e: React.KeyboardEvent) {
    const arrow = e.key;
    if (
      arrow === "ArrowLeft" ||
      arrow === "ArrowRight" ||
      arrow === "ArrowUp" ||
      arrow === "ArrowDown"
    ) {
      e.preventDefault();
      setFocus((f) => moveFocus(f, dentition, arrow));
      return;
    }
    if (e.key === "Enter" && onApply) {
      e.preventDefault();
      onApply(focus.tooth, focus.surface, applyCondition);
    }
  }

  const rows = rowsForDentition(dentition);

  return (
    <div className="tooth-chart" aria-labelledby={labelId}>
      <div className="tooth-chart-head">
        <h2 id={labelId}>Tooth chart</h2>
        <p className="muted small">
          R (patient&apos;s right) · FDI · Arrows move · Enter applies {applyCondition}
        </p>
      </div>
      <div
        className="tooth-chart-board"
        tabIndex={0}
        role="application"
        aria-label="Tooth chart. Use arrow keys and Enter."
        onKeyDown={handleKeyDown}
      >
        <span className="tooth-chart-side" aria-hidden>
          R
        </span>
        <div className="tooth-chart-arches">
          {rows.map((row, i) => (
            <div key={i} className="tooth-chart-row">
              {row.map((fdi) => (
                <ToothGlyph
                  key={fdi}
                  fdi={fdi}
                  cells={cells}
                  focused={focus.tooth === fdi}
                  focusSurface={focus.surface}
                  onSelect={(surface) => setFocus({ tooth: fdi, surface })}
                />
              ))}
            </div>
          ))}
        </div>
        <span className="tooth-chart-side" aria-hidden>
          L
        </span>
      </div>
      {legend.length > 0 && (
        <ul className="tooth-chart-legend">
          {legend.map((item) => (
            <li key={item.code}>
              <span
                className="tooth-chart-swatch"
                style={item.color ? { background: item.color } : undefined}
              />
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
