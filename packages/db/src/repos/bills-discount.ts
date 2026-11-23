import {
  computeBillTotals,
  type ApproveBillDiscountInput,
  type GstMode,
  type RequestBillDiscountInput,
  type TaxCategory,
} from "@clinic/shared";
import { and, asc, eq, isNull } from "drizzle-orm";
import { auditInsert, auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { billItems, bills, settings } from "../schema";
import { nowUtcSql } from "../sql";
import { billsGetRepo, type BillRow } from "./bills-get";

function assertDraft(status: string) {
  if (status !== "draft") {
    throw new InvalidError("This bill is locked. Cancel it and create a new bill instead.");
  }
}

async function gstMode(db: Db): Promise<GstMode> {
  const row = await db
    .select({ valueJson: settings.valueJson })
    .from(settings)
    .where(and(eq(settings.key, "billing.gst_mode"), isNull(settings.deletedAt)))
    .get();
  if (!row) return "off";
  try {
    return JSON.parse(row.valueJson) === "on" ? "on" : "off";
  } catch {
    return "off";
  }
}

export function billsDiscountRepo(db: Db, ctx: Ctx) {
  const getRepo = billsGetRepo(db, ctx);

  return {
    /** Receptionist or doctor: set discount on a draft (clears prior approval). */
    async requestDiscount(id: string, input: RequestBillDiscountInput): Promise<BillRow> {
      assertAllowed(ctx, "bills.create");
      const row = await db
        .select()
        .from(bills)
        .where(and(eq(bills.id, id), isNull(bills.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("That bill");
      assertDraft(row.status);
      if (row.version !== input.version) throw new ConflictError();

      const items = await db
        .select({
          procedureLabel: billItems.procedureLabel,
          toothFdi: billItems.toothFdi,
          qty: billItems.qty,
          unitPaise: billItems.unitPaise,
          discountPaise: billItems.discountPaise,
          taxCategory: billItems.taxCategory,
        })
        .from(billItems)
        .where(and(eq(billItems.billId, id), isNull(billItems.deletedAt)))
        .orderBy(asc(billItems.sortOrder))
        .all();

      const mode = await gstMode(db);
      let totals;
      try {
        totals = computeBillTotals(
          items.map((i) => ({
            ...i,
            taxCategory: i.taxCategory as TaxCategory,
          })),
          {
            gstMode: mode,
            billDiscountPaise: input.discountPaise,
            billDiscountPercent: input.discountPercent,
          },
        );
      } catch (e) {
        throw new InvalidError(e instanceof Error ? e.message : "Check the discount.");
      }
      if (totals.discountPaise <= 0) {
        throw new InvalidError("Discount must be greater than zero.");
      }

      const results = await db.batch([
        db
          .update(bills)
          .set({
            discountPaise: totals.discountPaise,
            discountReason: input.reason,
            discountApprovedBy: null,
            discountApprovedAt: null,
            subtotalPaise: totals.subtotalPaise,
            taxPaise: totals.taxPaise,
            roundOffPaise: totals.roundOffPaise,
            totalPaise: totals.totalPaise,
            version: row.version + 1,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(and(eq(bills.id, id), eq(bills.version, input.version)))
          .returning({ id: bills.id }),
        auditInsertIfChanged(db, ctx, {
          action: "update",
          table: "bills",
          rowId: id,
          before: { discountPaise: row.discountPaise, discountApprovedBy: row.discountApprovedBy },
          after: {
            discountPaise: totals.discountPaise,
            discountReason: input.reason,
            discountApprovedBy: null,
          },
        }),
      ]);
      const updated = results[0] as { id: string }[];
      if (!updated.length) throw new ConflictError();
      return getRepo.get(id);
    },

    /** Doctor only: approve a pending discount so the bill can be issued. */
    async approveDiscount(id: string, input: ApproveBillDiscountInput): Promise<BillRow> {
      assertAllowed(ctx, "bills.adjust");
      const row = await db
        .select()
        .from(bills)
        .where(and(eq(bills.id, id), isNull(bills.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("That bill");
      assertDraft(row.status);
      if (row.version !== input.version) throw new ConflictError();
      if (row.discountPaise <= 0) {
        throw new InvalidError("This bill has no discount to approve.");
      }
      if (row.discountApprovedBy) {
        throw new InvalidError("This discount is already approved.");
      }

      const results = await db.batch([
        db
          .update(bills)
          .set({
            discountApprovedBy: ctx.userId,
            discountApprovedAt: nowUtcSql,
            version: row.version + 1,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(and(eq(bills.id, id), eq(bills.version, input.version)))
          .returning({ id: bills.id }),
        auditInsert(db, ctx, {
          action: "update",
          table: "bills",
          rowId: id,
          before: { discountApprovedBy: null },
          after: { discountApprovedBy: ctx.userId },
        }),
      ]);
      const updated = results[0] as { id: string }[];
      if (!updated.length) throw new ConflictError();
      return getRepo.get(id);
    },
  };
}
