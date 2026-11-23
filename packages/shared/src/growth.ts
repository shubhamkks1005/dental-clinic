/** 6.3.5: never show a bare % when the base is thin. */

/** Below this event count, show "Thin data" instead of a loud %. */
export const GROWTH_THIN_EVENTS = 20;

export type GrowthView =
  | { kind: "thin"; current: number; previous: number }
  | { kind: "flat"; current: number; previous: number }
  | { kind: "up" | "down"; current: number; previous: number; delta: number; percent: number };

export function growthView(current: number, previous: number): GrowthView {
  if (previous < GROWTH_THIN_EVENTS && current < GROWTH_THIN_EVENTS) {
    return { kind: "thin", current, previous };
  }
  const delta = current - previous;
  if (delta === 0) return { kind: "flat", current, previous };
  if (previous === 0) {
    return { kind: "up", current, previous, delta, percent: 100 };
  }
  const percent = Math.round((delta / previous) * 100);
  return {
    kind: delta > 0 ? "up" : "down",
    current,
    previous,
    delta,
    percent,
  };
}

/** Short English note for a KPI tile (always includes counts). */
export function growthNote(view: GrowthView, unit = ""): string {
  const u = unit ? ` ${unit}` : "";
  if (view.kind === "thin") {
    return `Thin data (${view.previous} → ${view.current}${u})`;
  }
  if (view.kind === "flat") {
    return `Same as before (${view.current}${u})`;
  }
  const sign = view.delta > 0 ? "+" : "";
  return `${sign}${view.delta}${u} (${sign}${view.percent}%) vs ${view.previous}${u}`;
}
