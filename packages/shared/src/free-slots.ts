import { appointmentHoldsChair, type AppointmentStatus, DEFAULT_CHAIR_ID } from "./appointments";
import { clinicWorkingIntervals } from "./booking-rules";
import { addIstDays, istDate, istLocalToUtc, istMinutes } from "./time";
import type { Holiday, Timings } from "./timings";

export type BusyBlock = {
  dateLocal: string;
  startMin: number;
  endMin: number;
  status: AppointmentStatus;
  chairId?: string;
};

export type FreeSlot = {
  dateLocal: string;
  startMin: number;
  endMin: number;
  startAt: Date;
};

const SEARCH_DAYS = 14;
const TODAY_LEAD_MINUTES = 15;

// Earliest time to offer when booking "from now" (PLAN 2.3.3: today = now + 15 minutes).
export function slotSearchEarliest(now: Date): Date {
  return new Date(now.getTime() + TODAY_LEAD_MINUTES * 60 * 1000);
}

function overlaps(a0: number, a1: number, b0: number, b1: number): boolean {
  return a0 < b1 && b0 < a1;
}

function fitsInIntervals(start: number, end: number, intervals: [number, number][]): boolean {
  return intervals.some(([from, to]) => start >= from && end <= to);
}

/**
 * Next free slots for one chair. Pure function: timings + holidays + busy rows in.
 * Candidate starts sit on the slot grid; the visit duration must fit inside one
 * working interval (does not cross lunch) and must not overlap a busy appointment.
 */
export function findFreeSlots(input: {
  timings: Timings;
  holidays: Holiday[];
  durationMin: number;
  earliest: Date;
  busy: BusyBlock[];
  limit?: number;
  chairId?: string;
  searchDays?: number;
}): FreeSlot[] {
  const limit = input.limit ?? 5;
  const chairId = input.chairId ?? DEFAULT_CHAIR_ID;
  const searchDays = input.searchDays ?? SEARCH_DAYS;
  const step = input.timings.slotMinutes;
  const duration = input.durationMin;
  if (duration <= 0 || step <= 0) return [];

  const busy = input.busy.filter(
    (b) => (b.chairId ?? DEFAULT_CHAIR_ID) === chairId && appointmentHoldsChair(b.status),
  );

  const startDay = istDate(input.earliest);
  const earliestMinFirstDay = istMinutes(input.earliest);
  const out: FreeSlot[] = [];

  for (let i = 0; i < searchDays && out.length < limit; i++) {
    const dateLocal = addIstDays(startDay, i);
    const intervals = clinicWorkingIntervals(dateLocal, input.timings, input.holidays);
    if (intervals.length === 0) continue;

    const dayBusy = busy.filter((b) => b.dateLocal === dateLocal);
    const openMin = intervals[0]![0];
    const closeMin = intervals[intervals.length - 1]![1];
    const minStart = i === 0 ? Math.max(openMin, earliestMinFirstDay) : openMin;
    // Snap up to the slot grid so offers align with workingSlots starts.
    const firstAligned =
      minStart <= openMin ? openMin : openMin + Math.ceil((minStart - openMin) / step) * step;

    for (let start = firstAligned; start + duration <= closeMin; start += step) {
      const end = start + duration;
      if (!fitsInIntervals(start, end, intervals)) continue;
      if (dayBusy.some((b) => overlaps(start, end, b.startMin, b.endMin))) continue;
      out.push({
        dateLocal,
        startMin: start,
        endMin: end,
        startAt: istLocalToUtc(dateLocal, start),
      });
      if (out.length >= limit) break;
    }
  }
  return out;
}
