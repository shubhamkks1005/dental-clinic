import type { ChartCell, ChartCondition, ToothSurface } from "@clinic/shared";

// The marking pad of the tooth card (design: B above, D/M left and right of O, L below, and
// "Whole tooth"). Teeth on the patient's right (quadrants 1, 4, 5, 8) have D on the left.

export type PadButton = {
  id: "B" | "left" | "O" | "right" | "L" | "W";
  surface: ToothSurface;
  /** The letter on the button. */
  label: string;
  /** The condition already on this surface: its short icon, or "·". */
  sub: string;
  /** The code of that condition, for colour. */
  code: string | null;
  disabled: boolean;
};

export function isPatientRight(fdi: number): boolean {
  return [1, 4, 5, 8].includes(Math.floor(fdi / 10));
}

export function padButtons(
  fdi: number,
  cells: ChartCell[],
  active: ChartCondition | undefined,
  readOnly: boolean,
  iconOf: (code: string) => string,
): PadButton[] {
  const right = isPatientRight(fdi);
  const side = (l: "d" | "m"): ToothSurface => l;
  const left = side(right ? "d" : "m");
  const rightS = side(right ? "m" : "d");
  const at = (s: ToothSurface) =>
    cells.find((c) => c.toothFdi === fdi && c.surface === s)?.conditionCode ?? null;
  const surfaceOff = readOnly || !active || active.appliesTo === "whole";
  const wholeOff = readOnly || !active || active.appliesTo === "surface";
  const make = (
    id: PadButton["id"],
    surface: ToothSurface,
    label: string,
    off: boolean,
  ): PadButton => {
    const code = at(surface);
    return { id, surface, label, sub: code ? iconOf(code) : "·", code, disabled: off };
  };
  return [
    make("B", "b", "B", surfaceOff),
    make("left", left, left.toUpperCase(), surfaceOff),
    make("O", "o", "O", surfaceOff),
    make("right", rightS, rightS.toUpperCase(), surfaceOff),
    make("L", "l", "L", surfaceOff),
    make("W", "whole", "Whole tooth", wholeOff),
  ];
}
