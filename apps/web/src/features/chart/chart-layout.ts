import { FDI_PERMANENT, FDI_PRIMARY, type FdiTooth, type ToothSurface } from "@clinic/shared";

/** Dentist view: patient's right on the left (3.4.3). Upper then lower. */
export const PERMANENT_ROWS: FdiTooth[][] = [
  [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
];

export const PRIMARY_ROWS: FdiTooth[][] = [
  [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
  [85, 84, 83, 82, 81, 71, 72, 73, 74, 75],
];

export type ChartDentition = "permanent" | "primary" | "mixed";

export function rowsForDentition(dentition: ChartDentition): FdiTooth[][] {
  if (dentition === "primary") return PRIMARY_ROWS;
  if (dentition === "mixed") {
    return [
      [...PRIMARY_ROWS[0]!, ...PERMANENT_ROWS[0]!],
      [...PRIMARY_ROWS[1]!, ...PERMANENT_ROWS[1]!],
    ];
  }
  return PERMANENT_ROWS;
}

export function flatTeeth(dentition: ChartDentition): FdiTooth[] {
  return rowsForDentition(dentition).flat();
}

/** Surface order for keyboard within one tooth (5 surfaces + whole). */
export const SURFACE_ORDER: ToothSurface[] = ["m", "o", "d", "b", "l", "whole"];

export function toothAriaLabel(fdi: FdiTooth): string {
  const set = new Set<number>(FDI_PRIMARY);
  const kind = set.has(fdi) ? "primary" : "permanent";
  return `Tooth ${fdi}, ${kind}`;
}

export function surfaceAriaLabel(fdi: FdiTooth, surface: ToothSurface): string {
  const names: Record<ToothSurface, string> = {
    m: "mesial",
    d: "distal",
    o: "occlusal or incisal",
    b: "buccal or facial",
    l: "lingual or palatal",
    whole: "whole tooth",
  };
  return `${toothAriaLabel(fdi)}, ${names[surface]}`;
}

export { FDI_PERMANENT, FDI_PRIMARY };
