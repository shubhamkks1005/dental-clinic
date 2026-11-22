import {
  CHART_NOTATION_LABEL,
  DEFAULT_CHART_VIEW,
  type ChartCell,
  type ChartView,
  type FdiTooth,
  type ToothSurface,
} from "@clinic/shared";
import { useEffect, useId, useState } from "react";
import { initialFocus, moveFocus, type ChartFocus } from "./chart-keyboard";
import { rowsForDentition, type ChartDentition } from "./chart-layout";
import { ToothGlyph } from "./ToothGlyph";
import "./chart.css";

export type ToothChartProps = {
  dentition?: ChartDentition;
  /** Facing + display notation; storage remains FDI (3.4.3). */
  view?: ChartView;
  cells?: ChartCell[];
  /** conditionCode → colour from the editable conditions list (3.4.4). */
  colorsByCode?: Map<string, string>;
  /** Condition applied when the doctor presses Enter on a focused surface (3.4.2). */
  applyCondition?: string;
  onApply?: (tooth: FdiTooth, surface: ToothSurface, conditionCode: string) => void;
  /** 3.5.4: notify when focus moves so procedures can use tooth/surface. */
  onFocusChange?: (tooth: FdiTooth, surface: ToothSurface) => void;
  legend?: { code: string; label: string; color?: string; icon?: string }[];
};

export function ToothChart({
  dentition = "permanent",
  view = DEFAULT_CHART_VIEW,
  cells = [],
  colorsByCode,
  applyCondition = "filling",
  onApply,
  onFocusChange,
  legend = [{ code: "filling", label: "Filling", icon: "F" }],
}: ToothChartProps) {
  const labelId = useId();
  const [focus, setFocus] = useState<ChartFocus>(() => initialFocus(dentition, view.facing));
  const notationName = CHART_NOTATION_LABEL[view.notation];
  const leftSide = view.facing === "dentist" ? "R" : "L";
  const rightSide = view.facing === "dentist" ? "L" : "R";
  const facingHint =
    view.facing === "dentist" ? "R (patient's right)" : "L (patient's left on left)";

  useEffect(() => {
    setFocus(initialFocus(dentition, view.facing));
  }, [dentition, view.facing]);

  function setFocusAndNotify(next: ChartFocus) {
    setFocus(next);
    onFocusChange?.(next.tooth, next.surface);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const arrow = e.key;
    if (
      arrow === "ArrowLeft" ||
      arrow === "ArrowRight" ||
      arrow === "ArrowUp" ||
      arrow === "ArrowDown"
    ) {
      e.preventDefault();
      setFocus((f) => {
        const next = moveFocus(f, dentition, arrow, view.facing);
        onFocusChange?.(next.tooth, next.surface);
        return next;
      });
      return;
    }
    if (e.key === "Enter" && onApply) {
      e.preventDefault();
      onApply(focus.tooth, focus.surface, applyCondition);
    }
  }

  const rows = rowsForDentition(dentition, view.facing);

  return (
    <div className="tooth-chart" aria-labelledby={labelId}>
      <div className="tooth-chart-head">
        <h2 id={labelId}>Tooth chart</h2>
        <p className="muted small">
          {facingHint} · {notationName} · Arrows move · Enter applies {applyCondition}
        </p>
      </div>
      <div
        className="tooth-chart-board"
        tabIndex={0}
        role="application"
        aria-label={`Tooth chart, ${notationName}. Use arrow keys and Enter.`}
        onKeyDown={handleKeyDown}
      >
        <span className="tooth-chart-side" aria-hidden>
          {leftSide}
        </span>
        <div className="tooth-chart-arches">
          {rows.map((row, i) => (
            <div key={i} className="tooth-chart-row">
              {row.map((fdi) => (
                <ToothGlyph
                  key={fdi}
                  fdi={fdi}
                  notation={view.notation}
                  cells={cells}
                  colorsByCode={colorsByCode}
                  focused={focus.tooth === fdi}
                  focusSurface={focus.surface}
                  onSelect={(surface) => setFocusAndNotify({ tooth: fdi, surface })}
                />
              ))}
            </div>
          ))}
        </div>
        <span className="tooth-chart-side" aria-hidden>
          {rightSide}
        </span>
      </div>
      {legend.length > 0 && (
        <ul className="tooth-chart-legend">
          {legend.map((item) => (
            <li key={item.code}>
              <span
                className="tooth-chart-swatch"
                style={item.color ? { background: item.color } : undefined}
                aria-hidden
              />
              <span className="tooth-chart-icon" aria-hidden>
                {item.icon ?? item.code.slice(0, 2)}
              </span>{" "}
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
