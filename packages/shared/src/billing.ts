import { z } from "zod";
import {
  assertPaise,
  assertRoundOffInRange,
  billNeedsCapConfirm,
  percentDiscountPaise,
  roundOffToRupee,
} from "./money";
import type { Parsed } from "./staff";

export const BILL_STATUSES = ["draft", "issued", "cancelled"] as const;
export type BillStatus = (typeof BILL_STATUSES)[number];

/** DRAFT - accountant to confirm category names and rates. */
export const TAX_CATEGORIES = ["exempt", "cosmetic"] as const;
export type TaxCategory = (typeof TAX_CATEGORIES)[number];

/** Basis points stored on the item (0 or 1800 = 18%). Used only when gst_mode is on. */
export const TAX_RATE_BP: Record<TaxCategory, number> = {
  exempt: 0,
  cosmetic: 1800,
};

export const PAYMENT_MODES = ["cash", "upi", "card", "bank", "cheque", "other"] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const GST_MODES = ["off", "on"] as const;
export type GstMode = (typeof GST_MODES)[number];

// "settled": the doctor turned the small remaining into a discount at the end of the visit.
export const DISCOUNT_REASONS = [
  "hardship",
  "staff_family",
  "courtesy",
  "settled",
  "other",
] as const;
export type DiscountReason = (typeof DISCOUNT_REASONS)[number];

const billItemInputSchema = z.object({
  procedureLabel: z.string().trim().min(1).max(120),
  toothFdi: z.number().int().optional().nullable(),
  qty: z.number().int().min(1).max(99).default(1),
  unitPaise: z.number().int().min(0),
  discountPaise: z.number().int().min(0).default(0),
  taxCategory: z.enum(TAX_CATEGORIES).default("exempt"),
  listItemId: z.string().min(1).optional().nullable(),
  planItemId: z.string().min(1).optional().nullable(),
  visitProcedureId: z.string().min(1).optional().nullable(),
  feeChangeReason: z.string().trim().max(200).optional().nullable(),
});

/** Input shape (defaults applied inside computeBillTotals). */
export type BillItemInput = z.input<typeof billItemInputSchema>;

export type ComputedBillItem = {
  procedureLabel: string;
  toothFdi?: number | null;
  qty: number;
  unitPaise: number;
  discountPaise: number;
  taxCategory: TaxCategory;
  taxRateBp: number;
  taxPaise: number;
  lineTotalPaise: number;
  listItemId?: string | null;
  planItemId?: string | null;
  visitProcedureId?: string | null;
  feeChangeReason?: string | null;
};

export type ComputedBillTotals = {
  items: ComputedBillItem[];
  subtotalPaise: number;
  discountPaise: number;
  taxPaise: number;
  roundOffPaise: number;
  totalPaise: number;
  needsCapConfirm: boolean;
};

/** Server-side totals: never trust client totals. gstMode off → tax always 0. */
export function computeBillTotals(
  items: BillItemInput[],
  opts: {
    gstMode: GstMode;
    /** Whole-bill percent discount 0–100; applied after line discounts, before tax. */
    billDiscountPercent?: number;
    /** Explicit bill-level discount in paise (takes precedence over percent if set). */
    billDiscountPaise?: number;
    /** When set, use this round-off (must be in ±99); otherwise auto. */
    roundOffPaise?: number;
  },
): ComputedBillTotals {
  if (items.length === 0) throw new Error("Add at least one bill item");

  const computed: ComputedBillItem[] = items.map((raw) => {
    const qty = raw.qty ?? 1;
    const discountPaise = raw.discountPaise ?? 0;
    const taxCategory = raw.taxCategory ?? "exempt";
    assertPaise(raw.unitPaise, "Unit price");
    assertPaise(discountPaise, "Line discount");
    const gross = raw.unitPaise * qty;
    if (discountPaise > gross) throw new Error("Line discount cannot exceed the line amount");
    const net = gross - discountPaise;
    const taxRateBp = opts.gstMode === "on" ? TAX_RATE_BP[taxCategory] : 0;
    const taxPaise = Math.floor((net * taxRateBp) / 10_000);
    return {
      ...raw,
      qty,
      discountPaise,
      taxCategory,
      taxRateBp,
      taxPaise,
      lineTotalPaise: net + taxPaise,
    };
  });

  const subtotalPaise = computed.reduce((s, i) => s + i.unitPaise * i.qty - i.discountPaise, 0);
  const linesTax = computed.reduce((s, i) => s + i.taxPaise, 0);

  let discountPaise = 0;
  if (opts.billDiscountPaise != null) {
    assertPaise(opts.billDiscountPaise, "Bill discount");
    discountPaise = opts.billDiscountPaise;
  } else if (opts.billDiscountPercent != null && opts.billDiscountPercent > 0) {
    discountPaise = percentDiscountPaise(subtotalPaise, opts.billDiscountPercent);
  }
  if (discountPaise > subtotalPaise) throw new Error("Bill discount cannot exceed the subtotal");

  const afterDiscount = subtotalPaise - discountPaise;
  // Bill-level discount does not change per-line tax already computed on net lines;
  // taxPaise on the bill is the sum of line taxes (gst off → 0).
  const taxPaise = linesTax;
  const beforeRound = afterDiscount + taxPaise;
  const roundOffPaise =
    opts.roundOffPaise != null ? opts.roundOffPaise : roundOffToRupee(beforeRound);
  assertRoundOffInRange(roundOffPaise);
  const totalPaise = beforeRound + roundOffPaise;

  return {
    items: computed,
    subtotalPaise,
    discountPaise,
    taxPaise,
    roundOffPaise,
    totalPaise,
    needsCapConfirm: billNeedsCapConfirm(totalPaise),
  };
}

const createBillSchema = z.object({
  patientId: z.string().min(1),
  visitId: z.string().min(1).optional().nullable(),
  billOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2026-11-23"),
  notes: z.string().trim().max(500).optional().default(""),
  kind: z.enum(["normal", "opening_balance"]).default("normal"),
  items: z.array(billItemInputSchema).min(1).max(100),
  billDiscountPercent: z.number().int().min(0).max(100).optional(),
  billDiscountPaise: z.number().int().min(0).optional(),
  discountReason: z.enum(DISCOUNT_REASONS).optional().nullable(),
  discountApproved: z.boolean().optional().default(false),
  capConfirmed: z.boolean().optional().default(false),
});

export type CreateBillInput = z.input<typeof createBillSchema>;

export function parseCreateBill(raw: unknown): Parsed<CreateBillInput> {
  const parsed = createBillSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the bill." };
  }
  return { ok: true, value: parsed.data };
}
