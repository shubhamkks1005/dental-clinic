import { PAYMENT_MODES } from "@clinic/shared";
import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { oneOf, standardColumns } from "./columns";

// 5.2.2 payments. Never edit after insert; reverse with a refund (5.2.3).
export const payments = sqliteTable(
  "payments",
  {
    ...standardColumns(),
    patientId: text("patient_id").notNull(),
    amountPaise: integer("amount_paise").notNull(),
    mode: text("mode", { enum: PAYMENT_MODES }).notNull(),
    /** Optional second mode for split cash+UPI (amount in split_paise). */
    splitMode: text("split_mode", { enum: PAYMENT_MODES }),
    splitPaise: integer("split_paise"),
    reference: text("reference").notNull().default(""),
    receiptNo: text("receipt_no"),
    receiptPeriod: text("receipt_period"),
    receivedAt: text("received_at").notNull(),
    receivedBy: text("received_by").notNull(),
    dayLocal: text("day_local").notNull(),
    notes: text("notes").notNull().default(""),
  },
  (t) => [
    index("payments_patient_received_idx").on(t.patientId, t.receivedAt),
    index("payments_day_local_idx").on(t.dayLocal),
    index("payments_period_no_idx").on(t.receiptPeriod, t.receiptNo),
    check("payments_mode_check", oneOf(t.mode.name, PAYMENT_MODES)),
    check(
      "payments_split_mode_check",
      sql.raw(
        `("split_mode" IS NULL OR "split_mode" IN ('cash','upi','card','bank','cheque','other'))`,
      ),
    ),
    check("payments_amount_positive", sql.raw(`"amount_paise" > 0`)),
    check(
      "payments_split_nonneg",
      sql.raw(`("split_paise" IS NULL OR ("split_paise" > 0 AND "split_paise" < "amount_paise"))`),
    ),
    check(
      "payments_day_local_format",
      sql.raw(`"day_local" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`),
    ),
  ],
);

export const paymentAllocations = sqliteTable(
  "payment_allocations",
  {
    ...standardColumns(),
    paymentId: text("payment_id").notNull(),
    billId: text("bill_id").notNull(),
    amountPaise: integer("amount_paise").notNull(),
  },
  (t) => [
    index("payment_allocations_payment_idx").on(t.paymentId),
    index("payment_allocations_bill_idx").on(t.billId),
    check("payment_allocations_amount_positive", sql.raw(`"amount_paise" > 0`)),
  ],
);

// 5.2.3 refunds. Linked to a payment; never exceed paid − prior refunds.
export const refunds = sqliteTable(
  "refunds",
  {
    ...standardColumns(),
    paymentId: text("payment_id").notNull(),
    patientId: text("patient_id").notNull(),
    amountPaise: integer("amount_paise").notNull(),
    mode: text("mode", { enum: PAYMENT_MODES }).notNull(),
    reason: text("reason").notNull(),
    refundNo: text("refund_no"),
    refundPeriod: text("refund_period"),
    approvedBy: text("approved_by").notNull(),
    approvedAt: text("approved_at").notNull(),
  },
  (t) => [
    index("refunds_payment_idx").on(t.paymentId),
    index("refunds_patient_idx").on(t.patientId, t.approvedAt),
    index("refunds_period_no_idx").on(t.refundPeriod, t.refundNo),
    check("refunds_mode_check", oneOf(t.mode.name, PAYMENT_MODES)),
    check("refunds_amount_positive", sql.raw(`"amount_paise" > 0`)),
  ],
);
