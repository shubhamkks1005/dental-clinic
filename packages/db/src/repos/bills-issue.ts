import { financialYearOf, shortFinancialYear } from "@clinic/shared";
import { and, eq, isNull, sql } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { takeNumber } from "../numbering";
import { assertAllowed } from "../permissions";
import { bills, settings } from "../schema";
import { nowUtcSql } from "../sql";
import { billsGetRepo, type BillRow } from "./bills-get";
import { paymentsApplyAdvanceRepo } from "./payments-apply-advance";

async function shadowSeries(db: Db): Promise<boolean> {
  const row = await db
    .select({ valueJson: settings.valueJson })
    .from(settings)
    .where(and(eq(settings.key, "billing.shadow_series"), isNull(settings.deletedAt)))
    .get();
  if (!row) return true;
  try {
    return JSON.parse(row.valueJson) === true;
  } catch {
    return true;
  }
}

function billNoSql(period: string, value: ReturnType<typeof sql<number>>, shadow: boolean) {
  const prefix = shadow ? "SB" : "B";
  const short = shortFinancialYear(period);
  return sql<string>`printf('%s-%s-%06d', ${prefix}, ${short}, ${value})`;
}

export function billsIssueRepo(db: Db, ctx: Ctx) {
  const getRepo = billsGetRepo(db, ctx);

  return {
    async issue(
      id: string,
      version: number,
      opts: { applyAdvance?: boolean } = {},
    ): Promise<BillRow> {
      assertAllowed(ctx, "bills.create");
      const row = await db
        .select()
        .from(bills)
        .where(and(eq(bills.id, id), isNull(bills.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("That bill");
      if (row.status !== "draft") {
        throw new InvalidError("Only a draft bill can be issued.");
      }
      if (row.version !== version) throw new ConflictError();
      if (row.discountPaise > 0 && !row.discountApprovedBy) {
        throw new InvalidError("A doctor must approve the discount before issuing this bill.");
      }

      const period = financialYearOf(new Date());
      const shadow = await shadowSeries(db);
      const { bump, value } = takeNumber(db, "bill", period, ctx.userId);
      const billNo = billNoSql(period, value, shadow);

      const results = await db.batch([
        bump,
        db
          .update(bills)
          .set({
            status: "issued",
            billPeriod: period,
            billNo,
            issuedAt: nowUtcSql,
            issuedBy: ctx.userId,
            version: row.version + 1,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(and(eq(bills.id, id), eq(bills.version, version)))
          .returning({ id: bills.id }),
        auditInsert(db, ctx, {
          action: "update",
          table: "bills",
          rowId: id,
          before: { status: "draft" },
          after: { status: "issued", billPeriod: period },
        }),
      ]);

      const updated = results[1] as { id: string }[];
      if (!updated.length) throw new ConflictError();

      // 5.3.5: optional credit from prior unallocated payments.
      if (opts.applyAdvance) {
        await paymentsApplyAdvanceRepo(db, ctx).applyAdvanceToBill(id);
      }
      return getRepo.get(id);
    },
  };
}
