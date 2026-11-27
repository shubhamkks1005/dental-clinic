import { BILL_STATUSES, TAX_CATEGORIES } from "@clinic/shared";
import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { oneOf, standardColumns } from "./columns";

const BILL_KINDS = ["normal", "opening_balance"] as const;

// 5.2.1 bills. Issued/cancelled rows are locked; corrections = cancel + new bill (5.2.7).
export const bills = sqliteTable(
  "bills",
  {
    ...standardColumns(),
    patientId: text("patient_id").notNull(),
    visitId: text("visit_id"),
    // 0067: an invoice the desk started at arrival names its appointment (visit comes later).
    appointmentId: text("appointment_id"),
    billNo: text("bill_no"),
    billPeriod: text("bill_period"),
    billOn: text("bill_on").notNull(),
    status: text("status", { enum: BILL_STATUSES }).notNull().default("draft"),
    kind: text("kind", { enum: BILL_KINDS }).notNull().default("normal"),
    subtotalPaise: integer("subtotal_paise").notNull().default(0),
    discountPaise: integer("discount_paise").notNull().default(0),
    discountReason: text("discount_reason"),
    discountApprovedBy: text("discount_approved_by"),
    discountApprovedAt: text("discount_approved_at"),
    taxPaise: integer("tax_paise").notNull().default(0),
    roundOffPaise: integer("round_off_paise").notNull().default(0),
    totalPaise: integer("total_paise").notNull().default(0),
    notes: text("notes").notNull().default(""),
    cancelReason: text("cancel_reason"),
    cancelledAt: text("cancelled_at"),
    cancelledBy: text("cancelled_by"),
    issuedAt: text("issued_at"),
    issuedBy: text("issued_by"),
  },
  (t) => [
    index("bills_patient_created_idx").on(t.patientId, t.createdAt),
    index("bills_period_no_idx").on(t.billPeriod, t.billNo),
    index("bills_patient_status_idx").on(t.patientId, t.status),
    index("bills_appointment_idx").on(t.appointmentId),
    // 0063: one live bill per visit.
    uniqueIndex("bills_visit_live_uidx")
      .on(t.visitId)
      .where(
        sql`${t.visitId} IS NOT NULL AND ${t.status} != 'cancelled' AND ${t.deletedAt} IS NULL`,
      ),
    check("bills_status_check", oneOf(t.status.name, BILL_STATUSES)),
    check("bills_kind_check", oneOf(t.kind.name, BILL_KINDS)),
    check(
      "bills_bill_on_format",
      sql.raw(`"bill_on" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`),
    ),
    check("bills_subtotal_nonneg", sql.raw(`"subtotal_paise" >= 0`)),
    check("bills_discount_nonneg", sql.raw(`"discount_paise" >= 0`)),
    check("bills_tax_nonneg", sql.raw(`"tax_paise" >= 0`)),
    check("bills_total_nonneg", sql.raw(`"total_paise" >= 0`)),
    check("bills_round_off_range", sql.raw(`"round_off_paise" BETWEEN -99 AND 99`)),
  ],
);

export const billItems = sqliteTable(
  "bill_items",
  {
    ...standardColumns(),
    billId: text("bill_id").notNull(),
    procedureLabel: text("procedure_label").notNull(),
    toothFdi: integer("tooth_fdi"),
    qty: integer("qty").notNull().default(1),
    unitPaise: integer("unit_paise").notNull(),
    discountPaise: integer("discount_paise").notNull().default(0),
    taxCategory: text("tax_category", { enum: TAX_CATEGORIES }).notNull().default("exempt"),
    taxRateBp: integer("tax_rate_bp").notNull().default(0),
    taxPaise: integer("tax_paise").notNull().default(0),
    lineTotalPaise: integer("line_total_paise").notNull(),
    listItemId: text("list_item_id"),
    planItemId: text("plan_item_id"),
    visitProcedureId: text("visit_procedure_id"),
    feeChangeReason: text("fee_change_reason"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    index("bill_items_bill_idx").on(t.billId, t.sortOrder),
    check("bill_items_tax_category_check", oneOf(t.taxCategory.name, TAX_CATEGORIES)),
    check("bill_items_qty_positive", sql.raw(`"qty" >= 1`)),
    check("bill_items_unit_nonneg", sql.raw(`"unit_paise" >= 0`)),
    check("bill_items_discount_nonneg", sql.raw(`"discount_paise" >= 0`)),
    check("bill_items_tax_nonneg", sql.raw(`"tax_paise" >= 0`)),
    check("bill_items_line_nonneg", sql.raw(`"line_total_paise" >= 0`)),
    check("bill_items_rate_nonneg", sql.raw(`"tax_rate_bp" >= 0`)),
  ],
);
