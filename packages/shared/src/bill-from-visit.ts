import { z } from "zod";
import type { Parsed } from "./staff";

// POST /visits/:id/bill: make the bill of a finished visit. `reviewFirst` keeps it a draft (for a
// discount or a changed line); `consultation` adds a Consultation line (amount typed, or the usual fee).
const billFromVisitSchema = z.object({
  reviewFirst: z.boolean().optional(),
  consultation: z.boolean().optional(),
  consultationPaise: z
    .number({ error: "Enter the consultation fee." })
    .int("Use a whole number of paise.")
    .min(1, "Enter the consultation fee.")
    .max(10_000_000, "The consultation fee is too high.")
    .nullable()
    .optional(),
});

export type BillFromVisitInput = z.infer<typeof billFromVisitSchema>;

export function parseBillFromVisit(body: unknown): Parsed<BillFromVisitInput> {
  if (body === null || body === undefined) return { ok: true, value: {} };
  const r = billFromVisitSchema.safeParse(body);
  if (!r.success) return { ok: false, message: r.error.issues[0]?.message ?? "Check the bill." };
  return { ok: true, value: r.data };
}
