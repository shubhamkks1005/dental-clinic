import { z } from "zod";
import { PAYMENT_MODES } from "./billing";
import type { Parsed } from "./staff";

const allocationSchema = z.object({
  billId: z.string().min(1),
  amountPaise: z.number().int().positive(),
});

const recordPaymentSchema = z.object({
  patientId: z.string().min(1),
  amountPaise: z.number().int().positive(),
  mode: z.enum(PAYMENT_MODES),
  splitMode: z.enum(PAYMENT_MODES).optional().nullable(),
  splitPaise: z.number().int().positive().optional().nullable(),
  reference: z.string().trim().max(80).optional().default(""),
  notes: z.string().trim().max(200).optional().default(""),
  /** When omitted, server allocates oldest dues first. */
  allocations: z.array(allocationSchema).max(50).optional(),
  dayLocal: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2026-11-23")
    .optional(),
  /** 5.3.9: allow posting to a closed day as a late entry (notes tagged). */
  lateEntry: z.boolean().optional().default(false),
});

export type RecordPaymentInput = z.input<typeof recordPaymentSchema>;

export function parseRecordPayment(raw: unknown): Parsed<z.infer<typeof recordPaymentSchema>> {
  const parsed = recordPaymentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the payment." };
  }
  const v = parsed.data;
  if (v.splitMode || v.splitPaise) {
    if (!v.splitMode || !v.splitPaise) {
      return { ok: false, message: "Split payment needs both a second mode and an amount." };
    }
    if (v.splitMode === v.mode) {
      return { ok: false, message: "Split modes must be different." };
    }
    if (v.splitPaise >= v.amountPaise) {
      return { ok: false, message: "The split amount must be less than the total." };
    }
  }
  return { ok: true, value: v };
}

const refundSchema = z.object({
  paymentId: z.string().min(1),
  amountPaise: z.number().int().positive(),
  mode: z.enum(PAYMENT_MODES),
  reason: z.string().trim().min(1).max(200),
});

export type RecordRefundInput = z.input<typeof refundSchema>;

export function parseRecordRefund(raw: unknown): Parsed<z.infer<typeof refundSchema>> {
  const parsed = refundSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the refund." };
  }
  return { ok: true, value: parsed.data };
}
