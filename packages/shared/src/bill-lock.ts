import { z } from "zod";
import type { Parsed } from "./staff";

// POST /bills/:id/lock (visit finished page): issue the invoice. When the patient paid more than
// the invoice, the doctor must say what happened to the extra (owner, 2026-11-27: nothing pre-chosen).
export const EXTRA_PAID_CHOICES = ["returned", "advance"] as const;
export type ExtraPaidChoice = (typeof EXTRA_PAID_CHOICES)[number];

export const EXTRA_RETURNED_REASON = "Extra returned at visit end";

const lockSchema = z.object({
  version: z.number().int().positive(),
  extra: z.enum(EXTRA_PAID_CHOICES).nullable().optional(),
});

export type LockBillInput = z.infer<typeof lockSchema>;

export function parseLockBill(raw: unknown): Parsed<LockBillInput> {
  const parsed = lockSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Send the invoice version to lock it." };
  return { ok: true, value: parsed.data };
}
