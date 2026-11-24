import type { AppointmentStatus } from "./appointments";
import { tunableDefault } from "./tunables";
import { istMinutes } from "./time";

export type ExpectedRow = {
  id: string;
  status: AppointmentStatus;
  startMin: number;
  endMin: number;
  steppedOutAt: string | null;
  /** When the patient sat in the chair (appointments.started_at). */
  startedAt: string | null;
};

/**
 * Expected start (IST minutes from midnight) for every row still to be seen, in list order.
 * The chair frees at max(now, in-chair start + planned length); each row then starts at
 * max(cursor, its booked start). A stepped-out row gets no expected time and does not move the
 * cursor. A doctor's break is NOT part of this (owner decision 4).
 */
export function expectedStarts(input: {
  ordered: readonly ExpectedRow[];
  now: Date;
  /** Override for tests: the minute the chair frees. */
  chairFreeAtMin?: number;
}): Map<string, number> {
  const nowMin = istMinutes(input.now);
  let cursor = input.chairFreeAtMin ?? nowMin;
  if (input.chairFreeAtMin === undefined) {
    const inChair = input.ordered.find((r) => r.status === "in_chair");
    if (inChair) {
      const since = inChair.startedAt ? istMinutes(new Date(inChair.startedAt)) : nowMin;
      cursor = Math.max(nowMin, since + (inChair.endMin - inChair.startMin));
    }
  }
  const out = new Map<string, number>();
  for (const row of input.ordered) {
    if (row.status === "in_chair" || row.status === "completed") continue;
    if (row.steppedOutAt) continue;
    const start = Math.max(cursor, row.startMin);
    out.set(row.id, start);
    cursor = start + (row.endMin - row.startMin);
  }
  return out;
}

/**
 * Minutes the first patient (Next) will start after the booked time, when that is more than
 * the "running late" limit; 0 otherwise.
 */
export function runningLateMinutes(input: {
  next: Pick<ExpectedRow, "id" | "startMin"> | null;
  expected: ReadonlyMap<string, number>;
  limitMinutes?: number;
}): number {
  if (!input.next) return 0;
  const exp = input.expected.get(input.next.id);
  if (exp === undefined) return 0;
  const late = exp - input.next.startMin;
  const limit = input.limitMinutes ?? tunableDefault("today.running_late_after_minutes");
  return late > limit ? late : 0;
}
