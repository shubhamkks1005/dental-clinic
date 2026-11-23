import { z } from "zod";
import type { Parsed } from "./staff";

/** Age of unpaid balance from oldest unpaid bill date (5.3.4). */
export const DUE_AGE_BUCKETS = ["0-30", "31-60", "61+"] as const;
export type DueAgeBucket = (typeof DUE_AGE_BUCKETS)[number];

export function dueAgeBucket(daysOutstanding: number): DueAgeBucket {
  if (daysOutstanding <= 30) return "0-30";
  if (daysOutstanding <= 60) return "31-60";
  return "61+";
}

/** Whole calendar days between two YYYY-MM-DD dates (toOn − fromOn). */
export function daysBetweenOn(fromOn: string, toOn: string): number {
  const [fy, fm, fd] = fromOn.split("-").map(Number) as [number, number, number];
  const [ty, tm, td] = toOn.split("-").map(Number) as [number, number, number];
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  return Math.floor((to - from) / 86_400_000);
}

const duesCallSchema = z.object({
  note: z.string().trim().min(1).max(500),
  calledOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export type DuesCallInput = z.infer<typeof duesCallSchema>;

export function parseDuesCall(body: unknown): Parsed<DuesCallInput> {
  const r = duesCallSchema.safeParse(body);
  if (!r.success) {
    return { ok: false, message: "Write a short note about the call." };
  }
  return { ok: true, value: r.data };
}
