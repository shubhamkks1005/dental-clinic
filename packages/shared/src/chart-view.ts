import { z } from "zod";
import { isFdiTooth, type FdiTooth } from "./teeth";

/** 3.4.3: one setting for chart facing + display notation. Storage is always FDI. */
export const CHART_FACINGS = ["dentist", "patient"] as const;
export type ChartFacing = (typeof CHART_FACINGS)[number];

export const CHART_NOTATIONS = ["fdi", "universal", "palmer"] as const;
export type ChartNotation = (typeof CHART_NOTATIONS)[number];

export const chartViewSchema = z.object({
  facing: z.enum(CHART_FACINGS, { error: "Pick dentist or patient facing." }),
  notation: z.enum(CHART_NOTATIONS, { error: "Pick FDI, Universal or Palmer." }),
});

export type ChartView = z.infer<typeof chartViewSchema>;

export const DEFAULT_CHART_VIEW: ChartView = { facing: "dentist", notation: "fdi" };

export const CHART_NOTATION_LABEL: Record<ChartNotation, string> = {
  fdi: "FDI",
  universal: "Universal",
  palmer: "Palmer",
};

/** Permanent FDI → ADA Universal 1–32. */
const UNIVERSAL_PERM: Record<number, number> = {
  18: 1,
  17: 2,
  16: 3,
  15: 4,
  14: 5,
  13: 6,
  12: 7,
  11: 8,
  21: 9,
  22: 10,
  23: 11,
  24: 12,
  25: 13,
  26: 14,
  27: 15,
  28: 16,
  38: 17,
  37: 18,
  36: 19,
  35: 20,
  34: 21,
  33: 22,
  32: 23,
  31: 24,
  41: 25,
  42: 26,
  43: 27,
  44: 28,
  45: 29,
  46: 30,
  47: 31,
  48: 32,
};

/** Primary FDI → ADA Universal A–T. */
const UNIVERSAL_PRIM: Record<number, string> = {
  55: "A",
  54: "B",
  53: "C",
  52: "D",
  51: "E",
  61: "F",
  62: "G",
  63: "H",
  64: "I",
  65: "J",
  75: "K",
  74: "L",
  73: "M",
  72: "N",
  71: "O",
  85: "P",
  84: "Q",
  83: "R",
  82: "S",
  81: "T",
};

function palmerLabel(fdi: FdiTooth): string {
  const q = Math.floor(fdi / 10);
  const n = fdi % 10;
  if (q >= 1 && q <= 4) {
    const side = q === 1 ? "UR" : q === 2 ? "UL" : q === 3 ? "LL" : "LR";
    return `${side}${n}`;
  }
  // Primary: 5=UR, 6=UL, 7=LL, 8=LR; letters A–E by position.
  const letter = String.fromCharCode(64 + n); // 1→A … 5→E
  const side = q === 5 ? "UR" : q === 6 ? "UL" : q === 7 ? "LL" : "LR";
  return `${side}${letter}`;
}

/** Display label for a stored FDI number under the active notation. */
export function toothDisplayLabel(fdi: number, notation: ChartNotation): string {
  if (!isFdiTooth(fdi)) return String(fdi);
  if (notation === "fdi") return String(fdi);
  if (notation === "universal") {
    const u = UNIVERSAL_PERM[fdi] ?? UNIVERSAL_PRIM[fdi];
    return u !== undefined ? String(u) : String(fdi);
  }
  return palmerLabel(fdi);
}
