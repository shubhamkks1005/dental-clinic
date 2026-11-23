import {
  allocateToBills,
  financialYearOf,
  istDate,
  newUlid,
  shortFinancialYear,
  unallocatedPaise,
  type RecordPaymentInput,
} from "@clinic/shared";
import { and, eq, isNull, sql } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { InvalidError, NotFoundError } from "../errors";
import { takeNumber } from "../numbering";
import { assertAllowed } from "../permissions";
import { patients, paymentAllocations, payments, settings } from "../schema";
import { nowUtcSql } from "../sql";
import { openBillDues } from "./bills-dues";
import { isDayClosed } from "./day-close";

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

function receiptNoSql(period: string, value: ReturnType<typeof sql<number>>, shadow: boolean) {
  const prefix = shadow ? "SR" : "R";
  const short = shortFinancialYear(period);
  return sql<string>`printf('%s-%s-%06d', ${prefix}, ${short}, ${value})`;
}

export type PaymentRow = {
  id: string;
  patientId: string;
  amountPaise: number;
  mode: string;
  splitMode: string | null;
  splitPaise: number | null;
  reference: string;
  receiptNo: string | null;
  dayLocal: string;
  allocations: { billId: string; amountPaise: number }[];
  advancePaise: number;
};

export function paymentsCreateRepo(db: Db, ctx: Ctx) {
  return {
    async record(input: RecordPaymentInput): Promise<PaymentRow> {
      assertAllowed(ctx, "bills.create");

      const patient = await db
        .select({ id: patients.id })
        .from(patients)
        .where(and(eq(patients.id, input.patientId), isNull(patients.deletedAt)))
        .get();
      if (!patient) throw new NotFoundError("That patient");

      const amountPaise = input.amountPaise;
      const dues = await openBillDues(db, input.patientId);

      let allocations: { billId: string; amountPaise: number }[];
      if (input.allocations && input.allocations.length > 0) {
        const dueMap = new Map(dues.map((d) => [d.billId, d.duePaise]));
        let used = 0;
        allocations = [];
        for (const a of input.allocations) {
          const due = dueMap.get(a.billId);
          if (due == null) {
            throw new InvalidError("That bill has no outstanding balance.");
          }
          if (a.amountPaise > due) {
            throw new InvalidError("A payment cannot be more than the bill balance.");
          }
          allocations.push({ billId: a.billId, amountPaise: a.amountPaise });
          used += a.amountPaise;
          dueMap.set(a.billId, due - a.amountPaise);
        }
        if (used > amountPaise) {
          throw new InvalidError("Allocations cannot exceed the payment.");
        }
      } else {
        allocations = allocateToBills(amountPaise, dues);
      }

      const advancePaise = unallocatedPaise(amountPaise, allocations);
      const dayLocal = input.dayLocal ?? istDate(new Date());
      const closed = await isDayClosed(db, dayLocal);
      if (closed && !input.lateEntry) {
        throw new InvalidError(
          "This day is closed. Use a late entry or ask the doctor to reopen it.",
        );
      }
      const baseNotes = input.notes ?? "";
      const notes =
        closed && input.lateEntry
          ? baseNotes
            ? `late entry · ${baseNotes}`
            : "late entry"
          : baseNotes;
      const period = financialYearOf(new Date());
      const shadow = await shadowSeries(db);
      const { bump, value } = takeNumber(db, "receipt", period, ctx.userId);
      const id = newUlid();
      const receiptNo = receiptNoSql(period, value, shadow);

      const allocInserts = allocations.map((a) =>
        db.insert(paymentAllocations).values({
          id: newUlid(),
          paymentId: id,
          billId: a.billId,
          amountPaise: a.amountPaise,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
      );

      await db.batch([
        bump,
        db.insert(payments).values({
          id,
          patientId: input.patientId,
          amountPaise,
          mode: input.mode,
          splitMode: input.splitMode ?? null,
          splitPaise: input.splitPaise ?? null,
          reference: input.reference ?? "",
          receiptNo,
          receiptPeriod: period,
          receivedAt: nowUtcSql,
          receivedBy: ctx.userId,
          dayLocal,
          notes,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
        ...allocInserts,
        auditInsert(db, ctx, {
          action: "create",
          table: "payments",
          rowId: id,
          before: null,
          after: {
            amountPaise,
            mode: input.mode,
            allocations,
            advancePaise,
          },
        }),
      ]);

      const stored = await db
        .select({
          id: payments.id,
          patientId: payments.patientId,
          amountPaise: payments.amountPaise,
          mode: payments.mode,
          splitMode: payments.splitMode,
          splitPaise: payments.splitPaise,
          reference: payments.reference,
          receiptNo: payments.receiptNo,
          dayLocal: payments.dayLocal,
        })
        .from(payments)
        .where(eq(payments.id, id))
        .get();
      if (!stored) throw new NotFoundError("That payment");

      return { ...stored, allocations, advancePaise };
    },
  };
}
