import { clinicWorkingIntervals } from "./booking-rules";
import type { CurrentBreak } from "./breaks";
import type { Holiday, Timings } from "./timings";

export type DayWindow = {
  dateLocal: string;
  dayStartMin: number;
  dayEndMin: number;
  slotMinutes: number;
  intervals: [number, number][];
  closed: boolean;
};

/** Who last changed the order of the day list, and when ("Order updated by Priya at 10:48 AM"). */
export type LastOrderChange = { byName: string | null; at: string };

/** One day of the staff appointment list; the same shape for the day view and each day of a range. */
export type AppointmentDayReply<A> = {
  dateLocal: string;
  serverNow: string;
  window: DayWindow;
  appointments: A[];
  /** Newest queue change of the day, or null. In a week range: today only. */
  lastOrderChange: LastOrderChange | null;
  /** The doctor's break that is on now, or null. In a week range: today only. */
  currentBreak: CurrentBreak | null;
};

/** S3.2.2: GET /appointments/range replies with the days in order, from first to last. */
export type AppointmentRangeReply<A> = { days: AppointmentDayReply<A>[] };

/** The longest range one request may ask for (the laptop week view). */
export const APPOINTMENT_RANGE_MAX_DAYS = 7;

/** Visible day bounds from timings (empty intervals → closed). */
export function dayWindow(dateLocal: string, timings: Timings, holidays: Holiday[]): DayWindow {
  const intervals = clinicWorkingIntervals(dateLocal, timings, holidays);
  if (intervals.length === 0) {
    return {
      dateLocal,
      dayStartMin: 0,
      dayEndMin: 0,
      slotMinutes: timings.slotMinutes,
      intervals: [],
      closed: true,
    };
  }
  const dayStartMin = Math.min(...intervals.map(([a]) => a));
  const dayEndMin = Math.max(...intervals.map(([, b]) => b));
  return {
    dateLocal,
    dayStartMin,
    dayEndMin,
    slotMinutes: timings.slotMinutes,
    intervals,
    closed: false,
  };
}

/** Snap a minute-of-day to the slot grid (floor toward day start). */
export function snapToSlot(min: number, slotMinutes: number, dayStartMin: number): number {
  const step = Math.max(1, slotMinutes);
  const offset = min - dayStartMin;
  if (offset <= 0) return dayStartMin;
  return dayStartMin + Math.floor(offset / step) * step;
}

/** Free slot starts inside working intervals, skipping busy ranges. */
export function emptySlotStarts(
  window: DayWindow,
  busy: { startMin: number; endMin: number }[],
): number[] {
  if (window.closed) return [];
  const step = window.slotMinutes;
  const out: number[] = [];
  for (const [from, to] of window.intervals) {
    for (let t = from; t + step <= to; t += step) {
      const end = t + step;
      const blocked = busy.some((b) => t < b.endMin && end > b.startMin);
      if (!blocked) out.push(t);
    }
  }
  return out;
}
