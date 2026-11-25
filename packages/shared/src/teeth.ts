// FDI tooth numbers: permanent 11–48, primary 51–85 (3.2.2 / 3.4.x). Stored always as FDI.

// Stored lowercase (db oneOf rule). Display as M/D/O/B/L in the chart UI.
export const TOOTH_SURFACES = ["m", "d", "o", "b", "l", "whole"] as const;
export type ToothSurface = (typeof TOOTH_SURFACES)[number];

export const TOOTH_SURFACE_LABEL: Record<ToothSurface, string> = {
  m: "M",
  d: "D",
  o: "O",
  b: "B",
  l: "L",
  whole: "Whole",
};

const PERMANENT = [
  11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28, 31, 32, 33, 34, 35, 36, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48,
] as const;

const PRIMARY = [
  51, 52, 53, 54, 55, 61, 62, 63, 64, 65, 71, 72, 73, 74, 75, 81, 82, 83, 84, 85,
] as const;

export const FDI_PERMANENT = PERMANENT;
export const FDI_PRIMARY = PRIMARY;
export const FDI_ALL = [...PERMANENT, ...PRIMARY] as const;
export type FdiTooth = (typeof FDI_ALL)[number];

const FDI_SET = new Set<number>(FDI_ALL);

export function isFdiTooth(n: number): n is FdiTooth {
  return FDI_SET.has(n);
}

export function isToothSurface(s: string): s is ToothSurface {
  return (TOOTH_SURFACES as readonly string[]).includes(s);
}

/** Latest event per tooth+surface wins; used to build the chart from append-only rows. */
export type ToothEventLike = {
  toothFdi: number;
  surface: ToothSurface;
  conditionCode: string;
  notedAt: string;
  id: string;
  visitId?: string | null;
};

export type ChartCell = {
  toothFdi: number;
  surface: ToothSurface;
  conditionCode: string;
  notedAt: string;
  eventId: string;
  visitId?: string | null;
  /** Highlight for events noted on the clinic's today (IST) or this draft visit (3.4.5). */
  changedToday?: boolean;
};

export function chartFromEvents(events: readonly ToothEventLike[]): ChartCell[] {
  const best = new Map<string, ToothEventLike>();
  for (const e of events) {
    const key = `${e.toothFdi}:${e.surface}`;
    const prev = best.get(key);
    if (!prev || e.notedAt > prev.notedAt || (e.notedAt === prev.notedAt && e.id > prev.id)) {
      best.set(key, e);
    }
  }
  return [...best.values()]
    .map((e) => ({
      toothFdi: e.toothFdi,
      surface: e.surface,
      conditionCode: e.conditionCode,
      notedAt: e.notedAt,
      eventId: e.id,
      visitId: e.visitId ?? null,
    }))
    .sort((a, b) => a.toothFdi - b.toothFdi || a.surface.localeCompare(b.surface));
}

/** Permanent tooth to the baby tooth it replaces (14 to 54). Molars (positions 6 to 8) have none. */
export function babyPredecessor(fdi: number): number | null {
  if (!isFdiTooth(fdi) || fdi > 48) return null;
  const quadrant = Math.floor(fdi / 10);
  const position = fdi % 10;
  if (position < 1 || position > 5) return null;
  return (quadrant + 4) * 10 + position;
}

/** Baby tooth to the permanent tooth that replaces it (54 to 14). */
export function permanentSuccessor(fdi: number): number | null {
  if (!isFdiTooth(fdi) || fdi < 51) return null;
  return (Math.floor(fdi / 10) - 4) * 10 + (fdi % 10);
}
