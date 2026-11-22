import { addIstDays, istDate, istLocalToUtc } from "./time";
import { dayKeyOf, toMinutes, type Holiday, type Timings } from "./timings";

export type BookingRuleCode = "past" | "closed" | "lunch" | "ahead";

export type BookingRuleViolation = {
  code: BookingRuleCode;
  message: string;
};

export type BookingSlot = {
  dateLocal: string;
  startMin: number;
  endMin: number;
};

/** Working minute ranges for one IST day (empty = closed or holiday). Shared with free-slots. */
export function clinicWorkingIntervals(
  isoDay: string,
  timings: Timings,
  holidays: Holiday[],
): [number, number][] {
  if (holidays.some((h) => h.date === isoDay)) return [];
  const day = timings.week[dayKeyOf(isoDay)];
  if (!day.open) return [];
  const open = toMinutes(day.start);
  const close = toMinutes(day.end);
  if (day.lunchStart && day.lunchEnd) {
    const lunchStart = toMinutes(day.lunchStart);
    const lunchEnd = toMinutes(day.lunchEnd);
    return [
      [open, lunchStart],
      [lunchEnd, close],
    ];
  }
  return [[open, close]];
}

function fitsInIntervals(start: number, end: number, intervals: [number, number][]): boolean {
  return intervals.some(([from, to]) => start >= from && end <= to);
}

/**
 * Soft booking rules (2.3.5). Returns every violation; empty means the slot is allowed
 * without override. Override with a reason sets overbook and is audited separately.
 */
export function bookingRuleViolations(input: {
  slot: BookingSlot;
  timings: Timings;
  holidays: Holiday[];
  bookAheadDays: number;
  now: Date;
}): BookingRuleViolation[] {
  const { slot, timings, holidays, bookAheadDays, now } = input;
  const out: BookingRuleViolation[] = [];

  const startAt = istLocalToUtc(slot.dateLocal, slot.startMin);
  if (startAt.getTime() < now.getTime()) {
    out.push({
      code: "past",
      message: "That time is already past. Pick a later slot, or override with a reason.",
    });
  }

  const intervals = clinicWorkingIntervals(slot.dateLocal, timings, holidays);
  if (intervals.length === 0) {
    out.push({
      code: "closed",
      message: "The clinic is closed that day. Pick another day, or override with a reason.",
    });
  } else if (!fitsInIntervals(slot.startMin, slot.endMin, intervals)) {
    out.push({
      code: "lunch",
      message:
        "That visit falls outside working hours or across lunch. Pick another time, or override with a reason.",
    });
  }

  const today = istDate(now);
  const lastAllowed = addIstDays(today, bookAheadDays);
  if (slot.dateLocal > lastAllowed) {
    out.push({
      code: "ahead",
      message: `Bookings may only go ${bookAheadDays} days ahead. Pick an earlier day, or override with a reason.`,
    });
  }

  return out;
}
