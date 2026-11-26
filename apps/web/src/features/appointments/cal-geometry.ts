import { formatClockTime, type DayWindow } from "@clinic/shared";

// Calendar grid maths (final design: 64 px per hour, HTML min-h 64). Pure, so the week and the
// day grid place things the same way and the numbers are tested.
export const HOUR_PX = 64;
export const SNAP_MIN = 15;
const PX_PER_MIN = HOUR_PX / 60;

export type GridSpan = { start: number; end: number };

/** Whole hours from the earliest opening to the latest closing of the shown days (L5). Bookings
 * outside the hours (late entries) widen it so they are never cut off. */
export function gridSpan(windows: DayWindow[], rows: { startMin: number; endMin: number }[] = []) {
  const open = windows.filter((w) => !w.closed);
  let start = open.length ? Math.min(...open.map((w) => w.dayStartMin)) : 9 * 60;
  let end = open.length ? Math.max(...open.map((w) => w.dayEndMin)) : 18 * 60;
  for (const r of rows) {
    start = Math.min(start, r.startMin);
    end = Math.max(end, r.endMin);
  }
  return { start: Math.floor(start / 60) * 60, end: Math.min(1440, Math.ceil(end / 60) * 60) };
}

export function hoursOf(span: GridSpan): number[] {
  const out: number[] = [];
  for (let m = span.start; m < span.end; m += 60) out.push(m);
  return out;
}

export const minToPx = (min: number, span: GridSpan) => (min - span.start) * PX_PER_MIN;

/** A card's place: 2 px inset at the top, at least 22 px tall. */
export function cardBox(startMin: number, endMin: number, span: GridSpan) {
  return {
    top: minToPx(startMin, span) + 2,
    height: Math.max(22, (endMin - startMin) * PX_PER_MIN - 4),
  };
}

/** HTML 1163: the live preview block's height for a length in minutes. */
export const previewHeight = (minutes: number) => Math.max(34, Math.round((minutes / 60) * 64) - 8);

/** Click inside an hour cell -> the 15-minute start under the pointer. */
export function snapInHour(hourMin: number, offsetY: number): number {
  const step = Math.floor(Math.max(0, Math.min(HOUR_PX - 1, offsetY)) / (SNAP_MIN * PX_PER_MIN));
  return hourMin + step * SNAP_MIN;
}

/** Breaks between the day's working intervals (the lunch band). */
export function gapsOf(window: DayWindow): [number, number][] {
  if (window.closed) return [];
  const sorted = [...window.intervals].sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = sorted[i - 1]![1];
    const nextStart = sorted[i]![0];
    if (nextStart > prevEnd) out.push([prevEnd, nextStart]);
  }
  return out;
}

/** Gaps every open day shares: drawn once across the grid with the pill (HTML 383-391). */
export function sharedGaps(windows: DayWindow[]): [number, number][] {
  const open = windows.filter((w) => !w.closed);
  if (open.length === 0) return [];
  const key = (g: [number, number]) => `${g[0]}-${g[1]}`;
  const first = gapsOf(open[0]!);
  return first.filter((g) => open.every((w) => gapsOf(w).some((x) => key(x) === key(g))));
}

export type CellState = "open" | "past" | "closed" | "off";

/** Can this hour cell take a booking? "off" = outside working time (lunch, before, after). */
export function cellState(
  window: DayWindow,
  hourMin: number,
  now: { date: string; min: number },
): CellState {
  if (window.closed) return "closed";
  const end = hourMin + 60;
  if (window.dateLocal < now.date || (window.dateLocal === now.date && end <= now.min))
    return "past";
  const open = window.intervals.some(([a, b]) => a < end && b > hourMin);
  return open ? "open" : "off";
}

/** First 15-minute start a cell click may take: never before the opening or before now. */
export function firstStartInCell(
  window: DayWindow,
  hourMin: number,
  wanted: number,
  now: { date: string; min: number },
): number {
  let start = wanted;
  if (window.dateLocal === now.date)
    start = Math.max(start, Math.ceil(now.min / SNAP_MIN) * SNAP_MIN);
  const iv = window.intervals.find(([a, b]) => start < b && b > hourMin && a < hourMin + 60);
  if (iv && start < iv[0]) start = Math.ceil(iv[0] / SNAP_MIN) * SNAP_MIN;
  return start;
}

/** L19: the header Book button starts at today's next open 15-minute time, else the next open
 * day's first time (null when no day of the list is open). */
export function nextOpenStart(
  windows: DayWindow[],
  now: { date: string; min: number },
): { dateLocal: string; startMin: number } | null {
  const sorted = [...windows].sort((a, b) => a.dateLocal.localeCompare(b.dateLocal));
  for (const w of sorted) {
    if (w.closed || w.dateLocal < now.date) continue;
    const from = w.dateLocal === now.date ? Math.ceil(now.min / SNAP_MIN) * SNAP_MIN : 0;
    for (const [a, b] of [...w.intervals].sort((x, y) => x[0] - y[0])) {
      const start = Math.max(Math.ceil(a / SNAP_MIN) * SNAP_MIN, from);
      if (start + SNAP_MIN <= b) return { dateLocal: w.dateLocal, startMin: start };
    }
  }
  return null;
}

/** HTML time column "08:00 AM" (two-digit hour). */
export function hourLabel(min: number): string {
  const t = formatClockTime(min);
  return t.length === 7 ? `0${t}` : t;
}

/** "12:00 PM – 12:30 PM (30m)" (HTML 1167). */
export function rangeLabel(startMin: number, minutes: number, dash = "–"): string {
  return `${formatClockTime(startMin)} ${dash} ${formatClockTime(startMin + minutes)} (${minutes}m)`;
}
