import { newUlid, type CloseDayInput, type PaymentMode, type ReopenDayInput } from "@clinic/shared";
import { and, eq, isNull, sql } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { dayCloses, payments } from "../schema";
import { nowUtcSql } from "../sql";

export type ModeTotals = Record<PaymentMode, number>;

export type DaySummary = {
  dayLocal: string;
  modeTotals: ModeTotals;
  cashExpectedPaise: number;
  digitalPaise: number;
  totalPaise: number;
  paymentCount: number;
  closed: boolean;
  close: {
    id: string;
    cashCountedPaise: number;
    differencePaise: number;
    note: string;
    closedBy: string;
    closedAt: string;
  } | null;
};

const EMPTY_MODES: ModeTotals = {
  cash: 0,
  upi: 0,
  card: 0,
  bank: 0,
  cheque: 0,
  other: 0,
};

export async function isDayClosed(db: Db, dayLocal: string): Promise<boolean> {
  const row = await db
    .select({ id: dayCloses.id })
    .from(dayCloses)
    .where(
      and(
        eq(dayCloses.dayLocal, dayLocal),
        eq(dayCloses.status, "closed"),
        isNull(dayCloses.deletedAt),
      ),
    )
    .get();
  return Boolean(row);
}

async function modeTotalsForDay(
  db: Db,
  dayLocal: string,
): Promise<{
  modeTotals: ModeTotals;
  paymentCount: number;
}> {
  const rows = await db
    .select({
      mode: payments.mode,
      splitMode: payments.splitMode,
      splitPaise: payments.splitPaise,
      amountPaise: payments.amountPaise,
    })
    .from(payments)
    .where(and(eq(payments.dayLocal, dayLocal), isNull(payments.deletedAt)))
    .all();

  const modeTotals: ModeTotals = { ...EMPTY_MODES };
  for (const r of rows) {
    if (r.splitMode && r.splitPaise != null) {
      modeTotals[r.mode as PaymentMode] += r.amountPaise - r.splitPaise;
      modeTotals[r.splitMode as PaymentMode] += r.splitPaise;
    } else {
      modeTotals[r.mode as PaymentMode] += r.amountPaise;
    }
  }
  return { modeTotals, paymentCount: rows.length };
}

export function dayCloseRepo(db: Db, ctx: Ctx) {
  return {
    async summary(dayLocal: string): Promise<DaySummary> {
      assertAllowed(ctx, "bills.create");
      const { modeTotals, paymentCount } = await modeTotalsForDay(db, dayLocal);
      const cashExpectedPaise = modeTotals.cash;
      const digitalPaise =
        modeTotals.upi + modeTotals.card + modeTotals.bank + modeTotals.cheque + modeTotals.other;
      const totalPaise = cashExpectedPaise + digitalPaise;

      const closeRow = await db
        .select({
          id: dayCloses.id,
          cashCountedPaise: dayCloses.cashCountedPaise,
          differencePaise: dayCloses.differencePaise,
          note: dayCloses.note,
          closedBy: dayCloses.closedBy,
          closedAt: dayCloses.closedAt,
        })
        .from(dayCloses)
        .where(
          and(
            eq(dayCloses.dayLocal, dayLocal),
            eq(dayCloses.status, "closed"),
            isNull(dayCloses.deletedAt),
          ),
        )
        .get();

      return {
        dayLocal,
        modeTotals,
        cashExpectedPaise,
        digitalPaise,
        totalPaise,
        paymentCount,
        closed: Boolean(closeRow),
        close: closeRow ?? null,
      };
    },

    async close(input: CloseDayInput): Promise<DaySummary> {
      assertAllowed(ctx, "bills.create");
      if (await isDayClosed(db, input.dayLocal)) {
        throw new InvalidError("This day is already closed.");
      }

      const { modeTotals, paymentCount } = await modeTotalsForDay(db, input.dayLocal);
      const cashExpectedPaise = modeTotals.cash;
      const differencePaise = input.cashCountedPaise - cashExpectedPaise;
      if (differencePaise !== 0 && !input.note.trim()) {
        throw new InvalidError("Write a note explaining the cash difference.");
      }

      const id = newUlid();
      await db.batch([
        db.insert(dayCloses).values({
          id,
          dayLocal: input.dayLocal,
          status: "closed",
          cashExpectedPaise,
          cashCountedPaise: input.cashCountedPaise,
          differencePaise,
          note: input.note,
          modeTotalsJson: JSON.stringify(modeTotals),
          closedBy: ctx.userId,
          closedAt: nowUtcSql,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
        auditInsert(db, ctx, {
          action: "create",
          table: "day_closes",
          rowId: id,
          after: {
            dayLocal: input.dayLocal,
            cashExpectedPaise,
            cashCountedPaise: input.cashCountedPaise,
            differencePaise,
            paymentCount,
          },
        }),
      ]);
      return this.summary(input.dayLocal);
    },

    async reopen(input: ReopenDayInput): Promise<DaySummary> {
      assertAllowed(ctx, "bills.adjust");
      const row = await db
        .select()
        .from(dayCloses)
        .where(
          and(
            eq(dayCloses.dayLocal, input.dayLocal),
            eq(dayCloses.status, "closed"),
            isNull(dayCloses.deletedAt),
          ),
        )
        .get();
      if (!row) throw new NotFoundError("That closed day");

      await db.batch([
        db
          .update(dayCloses)
          .set({
            status: "reopened",
            reopenReason: input.reason,
            reopenedBy: ctx.userId,
            reopenedAt: nowUtcSql,
            version: sql`${dayCloses.version} + 1`,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(eq(dayCloses.id, row.id)),
        auditInsert(db, ctx, {
          action: "update",
          table: "day_closes",
          rowId: row.id,
          before: { status: "closed" },
          after: { status: "reopened", reason: input.reason },
        }),
      ]);
      return this.summary(input.dayLocal);
    },
  };
}
