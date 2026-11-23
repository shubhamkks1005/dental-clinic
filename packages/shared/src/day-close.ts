import { z } from "zod";
import type { Parsed } from "./staff";

const closeSchema = z.object({
  dayLocal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cashCountedPaise: z.number().int().min(0),
  note: z.string().trim().max(500).optional().default(""),
});

export type CloseDayInput = z.infer<typeof closeSchema>;

export function parseCloseDay(body: unknown): Parsed<CloseDayInput> {
  const r = closeSchema.safeParse(body);
  if (!r.success) {
    return { ok: false, message: "Enter the day and counted cash amount." };
  }
  return { ok: true, value: r.data };
}

const reopenSchema = z.object({
  dayLocal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().trim().min(1).max(200),
});

export type ReopenDayInput = z.infer<typeof reopenSchema>;

export function parseReopenDay(body: unknown): Parsed<ReopenDayInput> {
  const r = reopenSchema.safeParse(body);
  if (!r.success) {
    return { ok: false, message: "Enter a reason to reopen the day." };
  }
  return { ok: true, value: r.data };
}
