import { computeBillTotals, type RequestBillDiscountInput, type TaxCategory } from "@clinic/shared";
import { and, asc, eq, isNull } from "drizzle-orm";
import { auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { billItems, bills } from "../schema";
import { nowUtcSql } from "../sql";
import { assertDraft, gstMode } from "./bills-discount";
import { billsGetRepo, type BillRow } from "./bills-get";

// Visit finished page: the doctor gives a discount while the bill is still a draft, with no second
// approval (owner decision, 2026-11-25). It is the same two steps the desk path takes, request then
// approve, done in ONE batch, with an audit row for each. The receptionist path stays request only.
export function billsDiscountApplyRepo(db: Db, ctx: Ctx) {
  const getRepo = billsGetRepo(db, ctx);

  return {
    async applyDoctorDiscount(id: string, input: RequestBillDiscountInput): Promise<BillRow> {
      assertAllowed(ctx, "bills.adjust");
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

      let totals;
      try {
        totals = computeBillTotals(
          items.map((i) => ({ ...i, taxCategory: i.taxCategory as TaxCategory })),
          {
            gstMode: await gstMode(db),
            billDiscountPaise: input.discountPaise,
            billDiscountPercent: input.discountPercent,
          },
        );
      } catch (e) {
        throw new InvalidError(e instanceof Error ? e.message : "Check the discount.");
      }
      if (totals.discountPaise <= 0) throw new InvalidError("Discount must be greater than zero.");

      const results = await db.batch([
        db
          .update(bills)
          .set({
            discountPaise: totals.discountPaise,
            discountReason: input.reason,
            discountApprovedBy: ctx.userId,
            discountApprovedAt: nowUtcSql,
            subtotalPaise: totals.subtotalPaise,
            taxPaise: totals.taxPaise,
            roundOffPaise: totals.roundOffPaise,
            totalPaise: totals.totalPaise,
            version: row.version + 1,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(and(eq(bills.id, id), eq(bills.version, input.version), eq(bills.status, "draft")))
          .returning({ id: bills.id }),
        // Request, then approve: two audit rows, each written only if the update above happened.
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
        auditInsertIfChanged(db, ctx, {
          action: "update",
          table: "bills",
          rowId: id,
          before: { discountApprovedBy: null },
          after: { discountApprovedBy: ctx.userId, totalPaise: totals.totalPaise },
        }),
      ]);
      const updated = results[0] as { id: string }[];
      if (!updated.length) throw new ConflictError();
      return getRepo.get(id);
    },
  };
}
