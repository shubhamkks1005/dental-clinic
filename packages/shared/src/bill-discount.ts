import { z } from "zod";
import { DISCOUNT_REASONS } from "./billing";
import type { Parsed } from "./staff";

const requestSchema = z.object({
  version: z.number().int(),
  discountPaise: z.number().int().min(0).optional(),
  discountPercent: z.number().int().min(0).max(100).optional(),
  reason: z.enum(DISCOUNT_REASONS),
});

export type RequestBillDiscountInput = z.infer<typeof requestSchema>;

export function parseRequestBillDiscount(body: unknown): Parsed<RequestBillDiscountInput> {
  const r = requestSchema.safeParse(body);
  if (!r.success) {
    return { ok: false, message: "Pick a discount reason and amount." };
  }
  if (r.data.discountPaise == null && r.data.discountPercent == null) {
    return { ok: false, message: "Enter a discount amount or percent." };
  }
  return { ok: true, value: r.data };
}

const approveSchema = z.object({
  version: z.number().int(),
});

export type ApproveBillDiscountInput = z.infer<typeof approveSchema>;

export function parseApproveBillDiscount(body: unknown): Parsed<ApproveBillDiscountInput> {
  const r = approveSchema.safeParse(body);
  if (!r.success) {
    return { ok: false, message: "Send the bill version to approve the discount." };
  }
  return { ok: true, value: r.data };
}

/** Stored in bills.discount_reason when the doctor says no: the desk then sees why the discount is gone. */
export const DISCOUNT_REJECTED_REASON = "rejected";
export const DISCOUNT_REJECTED_TEXT = "Doctor did not approve the discount";

export type RejectBillDiscountInput = ApproveBillDiscountInput;

export function parseRejectBillDiscount(body: unknown): Parsed<RejectBillDiscountInput> {
  const r = approveSchema.safeParse(body);
  if (!r.success) {
    return { ok: false, message: "Send the bill version to reject the discount." };
  }
  return { ok: true, value: r.data };
}
