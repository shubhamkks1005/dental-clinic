import {
  computeBillTotals,
  feeChangeReasonOk,
  newUlid,
  type GstMode,
  type TaxCategory,
  type UpdateDraftBillInput,
} from "@clinic/shared";
import { and, eq, isNull } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { billItems, bills, listItems, settings, visitProcedures } from "../schema";
import { nowUtcSql } from "../sql";
import { billsGetRepo, type BillRow } from "./bills-get";

async function gstMode(db: Db): Promise<GstMode> {
  const row = await db
    .select({ valueJson: settings.valueJson })
    .from(settings)
    .where(and(eq(settings.key, "billing.gst_mode"), isNull(settings.deletedAt)))
    .get();
  if (!row) return "off";
  try {
    const v: unknown = JSON.parse(row.valueJson);
    return v === "on" ? "on" : "off";
  } catch {
    return "off";
  }
}

async function resolveListUnitPaise(
  db: Db,
  item: UpdateDraftBillInput["items"][number],
): Promise<number | null> {
  if (item.visitProcedureId) {
    const vp = await db
      .select({ defaultPaise: visitProcedures.defaultPaise })
      .from(visitProcedures)
      .where(and(eq(visitProcedures.id, item.visitProcedureId), isNull(visitProcedures.deletedAt)))
      .get();
    if (vp?.defaultPaise != null) return vp.defaultPaise;
  }
  if (item.listItemId) {
    const li = await db
      .select({ dataJson: listItems.dataJson })
      .from(listItems)
      .where(and(eq(listItems.id, item.listItemId), isNull(listItems.deletedAt)))
      .get();
    if (li) {
      try {
        const data = JSON.parse(li.dataJson) as { default_paise?: number };
        if (typeof data.default_paise === "number" && Number.isInteger(data.default_paise)) {
          return data.default_paise;
        }
      } catch {
        /* ignore */
      }
    }
  }
  return item.listUnitPaise ?? null;
}

/** 5.3.1: edit draft lines; fee change vs list/visit fee needs a reason. */
export function billsUpdateDraftRepo(db: Db, ctx: Ctx) {
  const getRepo = billsGetRepo(db, ctx);

  return {
    async updateDraft(id: string, input: UpdateDraftBillInput): Promise<BillRow> {
      assertAllowed(ctx, "bills.create");
      const row = await db
        .select()
        .from(bills)
        .where(and(eq(bills.id, id), isNull(bills.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("That bill");
      if (row.status !== "draft") {
        throw new InvalidError("Only a draft bill can be edited.");
      }
      if (row.version !== input.version) throw new ConflictError();

      const withList: {
        item: UpdateDraftBillInput["items"][number];
        listUnitPaise: number | null;
      }[] = [];
      for (const item of input.items) {
        const listUnitPaise = await resolveListUnitPaise(db, item);
        if (!feeChangeReasonOk(item.unitPaise, listUnitPaise, item.feeChangeReason)) {
          throw new InvalidError(
            `Give a reason when the fee for "${item.procedureLabel}" differs from the list.`,
          );
        }
        withList.push({ item, listUnitPaise });
      }

      const mode = await gstMode(db);
      let totals;
      try {
        totals = computeBillTotals(
          withList.map(({ item }) => ({
            ...item,
            taxCategory: (item.taxCategory ?? "exempt") as TaxCategory,
          })),
          {
            gstMode: mode,
            // Q1.7: only an approved discount lowers the total.
            billDiscountPaise:
              row.discountPaise > 0 && row.discountApprovedBy ? row.discountPaise : undefined,
          },
        );
      } catch (e) {
        throw new InvalidError(e instanceof Error ? e.message : "Check the bill amounts.");
      }

      // Drop feeChangeReason when the fee matches the list again.
      const itemsForInsert = totals.items.map((computed, i) => {
        const listUnit = withList[i]?.listUnitPaise ?? null;
        const reason =
          listUnit != null && computed.unitPaise !== listUnit
            ? withList[i]?.item.feeChangeReason?.trim() || null
            : null;
        return { ...computed, feeChangeReason: reason };
      });

      const oldItems = await db
        .select({ id: billItems.id })
        .from(billItems)
        .where(and(eq(billItems.billId, id), isNull(billItems.deletedAt)))
        .all();
      const oldIds = oldItems.map((i) => i.id);

      const itemInserts = itemsForInsert.map((item, i) =>
        db.insert(billItems).values({
          id: newUlid(),
          billId: id,
          procedureLabel: item.procedureLabel,
          toothFdi: item.toothFdi ?? null,
          qty: item.qty,
          unitPaise: item.unitPaise,
          discountPaise: item.discountPaise,
          taxCategory: item.taxCategory,
          taxRateBp: item.taxRateBp,
          taxPaise: item.taxPaise,
          lineTotalPaise: item.lineTotalPaise,
          listItemId: item.listItemId ?? null,
          planItemId: item.planItemId ?? null,
          visitProcedureId: item.visitProcedureId ?? null,
          feeChangeReason: item.feeChangeReason ?? null,
          sortOrder: i + 1,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
      );

      const billUpdate = db
        .update(bills)
        .set({
          subtotalPaise: totals.subtotalPaise,
          taxPaise: totals.taxPaise,
          roundOffPaise: totals.roundOffPaise,
          totalPaise: totals.totalPaise,
          discountPaise: row.discountApprovedBy ? totals.discountPaise : row.discountPaise,
          version: row.version + 1,
          updatedAt: nowUtcSql,
          updatedBy: ctx.userId,
        })
        .where(and(eq(bills.id, id), eq(bills.version, input.version)))
        .returning({ id: bills.id });

      const audit = auditInsert(db, ctx, {
        action: "update",
        table: "bills",
        rowId: id,
        before: { totalPaise: row.totalPaise, itemCount: oldIds.length },
        after: { totalPaise: totals.totalPaise, itemCount: itemsForInsert.length },
      });

      // Soft-delete current lines (0 rows OK), insert replacements, then version bump.
      const results = await db.batch([
        db
          .update(billItems)
          .set({ deletedAt: nowUtcSql, updatedAt: nowUtcSql, updatedBy: ctx.userId })
          .where(and(eq(billItems.billId, id), isNull(billItems.deletedAt))),
        itemInserts[0]!,
        ...itemInserts.slice(1),
        billUpdate,
        audit,
      ]);

      const updated = results[results.length - 2] as { id: string }[];
      if (!updated?.length) throw new ConflictError();

      return getRepo.get(id);
    },
  };
}
