import { z } from "zod";
import type { Parsed } from "./staff";

/** 5.3.1: replace draft bill lines (server recomputes totals). */
const draftItemSchema = z.object({
  procedureLabel: z.string().trim().min(1).max(120),
  toothFdi: z.number().int().optional().nullable(),
  qty: z.number().int().min(1).max(99).default(1),
  unitPaise: z.number().int().min(0),
  discountPaise: z.number().int().min(0).default(0),
  taxCategory: z.enum(["exempt", "cosmetic"]).default("exempt"),
  listItemId: z.string().min(1).optional().nullable(),
  planItemId: z.string().min(1).optional().nullable(),
  visitProcedureId: z.string().min(1).optional().nullable(),
  /** Required when unit differs from the list / visit procedure fee. */
  feeChangeReason: z.string().trim().max(200).optional().nullable(),
  /** Client hint of list fee; server re-checks against visit/list. */
  listUnitPaise: z.number().int().min(0).optional().nullable(),
});

const updateDraftBillSchema = z.object({
  version: z.number().int().positive(),
  items: z.array(draftItemSchema).min(1).max(100),
});

export type UpdateDraftBillInput = z.input<typeof updateDraftBillSchema>;

export function parseUpdateDraftBill(raw: unknown): Parsed<z.infer<typeof updateDraftBillSchema>> {
  const parsed = updateDraftBillSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the bill lines." };
  }
  return { ok: true, value: parsed.data };
}

/** When a list/visit fee is known and the unit differs, a reason is required. */
export function feeChangeReasonOk(
  unitPaise: number,
  listUnitPaise: number | null | undefined,
  reason: string | null | undefined,
): boolean {
  if (listUnitPaise == null) return true;
  if (unitPaise === listUnitPaise) return true;
  return Boolean(reason && reason.trim().length > 0);
}
