import { type BillingExportRow } from "@clinic/shared";
import { and, eq, gte, isNull, like, lte } from "drizzle-orm";
import { accessInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { assertAllowed } from "../permissions";
import { billItems, bills, patients, paymentAllocations, payments } from "../schema";

/** 5.3.12 monthly CA export: patient code only, no names. */
export function billsExportRepo(db: Db, ctx: Ctx) {
  return {
    async exportMonth(month: string): Promise<BillingExportRow[]> {
      assertAllowed(ctx, "reports.full");
      const start = `${month}-01`;
      const end = `${month}-31`;

      const billRows = await db
        .select({
          id: bills.id,
          billNo: bills.billNo,
          billOn: bills.billOn,
          totalPaise: bills.totalPaise,
          discountPaise: bills.discountPaise,
          taxPaise: bills.taxPaise,
          patientCode: patients.code,
        })
        .from(bills)
        .innerJoin(patients, eq(patients.id, bills.patientId))
        .where(
          and(
            eq(bills.status, "issued"),
            isNull(bills.deletedAt),
            isNull(patients.deletedAt),
            gte(bills.billOn, start),
            lte(bills.billOn, end),
            like(bills.billOn, `${month}-%`),
          ),
        )
        .all();

      await accessInsert(db, ctx, {
        action: "export",
        resource: "bills",
        resourceId: month,
      });

      if (billRows.length === 0) return [];

      const out: BillingExportRow[] = [];
      for (const bill of billRows) {
        const items = await db
          .select({
            procedureLabel: billItems.procedureLabel,
            taxCategory: billItems.taxCategory,
          })
          .from(billItems)
          .where(and(eq(billItems.billId, bill.id), isNull(billItems.deletedAt)))
          .all();

        const modeRows = await db
          .select({
            mode: payments.mode,
            splitMode: payments.splitMode,
            splitPaise: payments.splitPaise,
            amountPaise: payments.amountPaise,
            alloc: paymentAllocations.amountPaise,
          })
          .from(paymentAllocations)
          .innerJoin(payments, eq(payments.id, paymentAllocations.paymentId))
          .where(
            and(
              eq(paymentAllocations.billId, bill.id),
              isNull(paymentAllocations.deletedAt),
              isNull(payments.deletedAt),
            ),
          )
          .all();

        const modeTotals = new Map<string, number>();
        for (const m of modeRows) {
          // Allocate whole payment's mode mix proportionally to this bill allocation.
          if (m.splitMode && m.splitPaise != null && m.amountPaise > 0) {
            const primaryShare = Math.floor(
              (m.alloc * (m.amountPaise - m.splitPaise)) / m.amountPaise,
            );
            const splitShare = m.alloc - primaryShare;
            modeTotals.set(m.mode, (modeTotals.get(m.mode) ?? 0) + primaryShare);
            modeTotals.set(m.splitMode, (modeTotals.get(m.splitMode) ?? 0) + splitShare);
          } else {
            modeTotals.set(m.mode, (modeTotals.get(m.mode) ?? 0) + m.alloc);
          }
        }

        const labels = [...new Set(items.map((i) => i.procedureLabel))];
        const cats = [...new Set(items.map((i) => i.taxCategory))];
        out.push({
          date: bill.billOn,
          billNumber: bill.billNo ?? "",
          patientCode: bill.patientCode,
          procedureGroup: labels.join("; ") || "—",
          taxCategory: cats.join(";") || "exempt",
          amountPaise: bill.totalPaise,
          discountPaise: bill.discountPaise,
          taxPaise: bill.taxPaise,
          modes:
            [...modeTotals.entries()].map(([mode, paise]) => `${mode}:${paise}`).join(";") || "",
        });
      }

      // Stable order for CA.
      out.sort((a, b) => a.date.localeCompare(b.date) || a.billNumber.localeCompare(b.billNumber));
      return out;
    },
  };
}
