import {
  TOOTH_SURFACE_LABEL,
  type ChartCell,
  type FdiTooth,
  type ToothSurface,
} from "@clinic/shared";
import { SURFACE_ORDER, surfaceAriaLabel } from "./chart-layout";

type Props = {
  fdi: FdiTooth;
  cells: ChartCell[];
  focused: boolean;
  focusSurface: ToothSurface;
  onSelect: (surface: ToothSurface) => void;
};

const PATH: Record<Exclude<ToothSurface, "whole">, string> = {
  // Simple 5-zone square: M left, D right, O centre, B top, L bottom.
  b: "M 4 4 L 36 4 L 28 12 L 12 12 Z",
  l: "M 12 28 L 28 28 L 36 36 L 4 36 Z",
  m: "M 4 4 L 12 12 L 12 28 L 4 36 Z",
  d: "M 28 12 L 36 4 L 36 36 L 28 28 Z",
  o: "M 12 12 L 28 12 L 28 28 L 12 28 Z",
};

export function ToothGlyph({ fdi, cells, focused, focusSurface, onSelect }: Props) {
  const bySurface = new Map(cells.filter((c) => c.toothFdi === fdi).map((c) => [c.surface, c]));

  return (
    <div className={`tooth-glyph${focused ? " tooth-glyph-focus" : ""}`}>
      <svg viewBox="0 0 40 48" width="40" height="48" role="img" aria-label={`Tooth ${fdi}`}>
        {(Object.keys(PATH) as Exclude<ToothSurface, "whole">[]).map((surface) => {
          const cell = bySurface.get(surface);
          const isFocus = focused && focusSurface === surface;
          return (
            <path
              key={surface}
              d={PATH[surface]}
              className={`tooth-surf${cell ? " tooth-surf-marked" : ""}${isFocus ? " tooth-surf-focus" : ""}`}
              tabIndex={isFocus ? 0 : -1}
              role="button"
              aria-label={surfaceAriaLabel(fdi, surface)}
              aria-pressed={!!cell}
              onClick={() => onSelect(surface)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(surface);
                }
              }}
            />
          );
        })}
        <text x="20" y="46" textAnchor="middle" className="tooth-fdi">
          {fdi}
        </text>
      </svg>
      <button
        type="button"
        className={`tooth-whole${focused && focusSurface === "whole" ? " tooth-whole-focus" : ""}`}
        aria-label={surfaceAriaLabel(fdi, "whole")}
        onClick={() => onSelect("whole")}
      >
        {bySurface.get("whole")
          ? TOOTH_SURFACE_LABEL.whole
          : SURFACE_ORDER.includes("whole")
            ? "W"
            : "W"}
      </button>
    </div>
  );
}
