import { computeBillTotals, newUlid, type CreateBillInput, type GstMode } from "@clinic/shared";
import { and, eq, isNull } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { billItems, bills, patients, settings, visits } from "../schema";
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

export function billsCreateRepo(db: Db, ctx: Ctx) {
  const getRepo = billsGetRepo(db, ctx);

  return {
    async create(input: CreateBillInput): Promise<BillRow> {
      assertAllowed(ctx, "bills.create");

      const patient = await db
        .select({ id: patients.id })
        .from(patients)
        .where(and(eq(patients.id, input.patientId), isNull(patients.deletedAt)))
        .get();
      if (!patient) throw new NotFoundError("That patient");

      if (input.visitId) {
        const visit = await db
          .select({ id: visits.id, patientId: visits.patientId })
          .from(visits)
          .where(and(eq(visits.id, input.visitId), isNull(visits.deletedAt)))
          .get();
        if (!visit || visit.patientId !== input.patientId) {
          throw new NotFoundError("That visit");
        }
      }

      // 5.3.6: discount may be requested without approval; issue() blocks until doctor approves.
      const wantsDiscount =
        (input.billDiscountPaise != null && input.billDiscountPaise > 0) ||
        (input.billDiscountPercent != null && input.billDiscountPercent > 0);
      if (wantsDiscount && !input.discountReason) {
        throw new InvalidError("Pick a discount reason.");
      }
      if (input.discountApproved && ctx.role !== "doctor") {
        throw new InvalidError("Only a doctor can approve a discount.");
      }

      const mode = await gstMode(db);
      let totals;
      try {
        totals = computeBillTotals(input.items, {
          gstMode: mode,
          billDiscountPercent: input.billDiscountPercent,
          billDiscountPaise: input.billDiscountPaise,
        });
      } catch (e) {
        throw new InvalidError(e instanceof Error ? e.message : "Check the bill amounts.");
      }
      // Q1.7: a discount that is not doctor-approved is only a request; the total ignores it.
      const approvedNow = input.discountApproved === true && ctx.role === "doctor";
      const requestedDiscountPaise = totals.discountPaise;
      if (requestedDiscountPaise > 0 && !approvedNow) {
        totals = computeBillTotals(input.items, { gstMode: mode });
      }
      if (totals.needsCapConfirm && !input.capConfirmed) {
        throw new InvalidError("Confirm this bill: the total is over ₹10,00,000.");
      }

      const id = newUlid();
      const itemInserts = totals.items.map((item, i) =>
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

      try {
        await db.batch([
          db.insert(bills).values({
            id,
            patientId: input.patientId,
            visitId: input.visitId ?? null,
            billOn: input.billOn,
            status: "draft",
            kind: input.kind ?? "normal",
            subtotalPaise: totals.subtotalPaise,
            discountPaise: requestedDiscountPaise,
            discountReason: input.discountReason ?? null,
            discountApprovedBy: requestedDiscountPaise > 0 && approvedNow ? ctx.userId : null,
            discountApprovedAt: requestedDiscountPaise > 0 && approvedNow ? nowUtcSql : null,
            taxPaise: totals.taxPaise,
            roundOffPaise: totals.roundOffPaise,
            totalPaise: totals.totalPaise,
            notes: input.notes ?? "",
            createdBy: ctx.userId,
            updatedBy: ctx.userId,
          }),
          ...itemInserts,
          auditInsert(db, ctx, {
            action: "create",
            table: "bills",
            rowId: id,
            before: null,
            after: { status: "draft", patientId: input.patientId, totalPaise: totals.totalPaise },
          }),
        ]);
      } catch (e) {
        // The unique index (0063): a visit has one live bill. Never a raw database error on screen.
        if (
          e instanceof Error &&
          /UNIQUE/i.test(`${e.message} ${String(e.cause ?? "")}`) &&
          input.visitId
        ) {
          throw new InvalidError(
            "This visit already has a bill. Open it instead of making a second one.",
          );
        }
        throw e;
      }

      return getRepo.get(id);
    },
  };
}
