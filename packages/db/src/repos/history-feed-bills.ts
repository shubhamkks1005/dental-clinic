import { formatRupees } from "@clinic/shared";
import { and, desc, eq, isNull, lt, or } from "drizzle-orm";
import type { Db } from "../client";
import { bills, payments, refunds, users } from "../schema";
import type { HistoryFeedEntry, HistorySource, HistorySourceQuery } from "./history-feed-types";

function afterAt(col: typeof bills.createdAt, after: HistorySourceQuery["after"]) {
  if (!after) return undefined;
  return or(lt(col, after.at), and(eq(col, after.at), lt(bills.id, after.id)));
}

/** 5.3.16: bills in History (cancelled still listed). Receptionist sees money, not clinical labels beyond procedure names on the bill. */
export function billHistorySource(db: Db): HistorySource {
  return {
    async list(q: HistorySourceQuery): Promise<HistoryFeedEntry[]> {
      const rows = await db
        .select({
          id: bills.id,
          createdAt: bills.createdAt,
          issuedAt: bills.issuedAt,
          billNo: bills.billNo,
          status: bills.status,
          totalPaise: bills.totalPaise,
          discountPaise: bills.discountPaise,
          actorName: users.name,
        })
        .from(bills)
        .leftJoin(users, eq(users.id, bills.createdBy))
        .where(
          and(
            eq(bills.patientId, q.patientId),
            isNull(bills.deletedAt),
            afterAt(bills.createdAt, q.after),
          ),
        )
        .orderBy(desc(bills.createdAt), desc(bills.id))
        .limit(q.take)
        .all();

      return rows.map((r) => {
        const when = r.issuedAt ?? r.createdAt;
        const no = r.billNo ?? "Draft";
        const disc = r.discountPaise > 0 ? `; discount ${formatRupees(r.discountPaise)}` : "";
        const cancelled = r.status === "cancelled" ? " (cancelled)" : "";
        return {
          id: r.id,
          type: "bill" as const,
          at: when,
          summary: `Bill ${no}: ${formatRupees(r.totalPaise)}${disc}${cancelled}`,
          actorName: r.actorName ?? null,
          status: r.status,
          href: `/app/bills/${r.id}`,
        };
      });
    },
  };
}

export function paymentHistorySource(db: Db): HistorySource {
  return {
    async list(q: HistorySourceQuery): Promise<HistoryFeedEntry[]> {
      const rows = await db
        .select({
          id: payments.id,
          receivedAt: payments.receivedAt,
          amountPaise: payments.amountPaise,
          mode: payments.mode,
          receiptNo: payments.receiptNo,
          actorName: users.name,
        })
        .from(payments)
        .leftJoin(users, eq(users.id, payments.receivedBy))
        .where(
          and(
            eq(payments.patientId, q.patientId),
            isNull(payments.deletedAt),
            q.after
              ? or(
                  lt(payments.receivedAt, q.after.at),
                  and(eq(payments.receivedAt, q.after.at), lt(payments.id, q.after.id)),
                )
              : undefined,
          ),
        )
        .orderBy(desc(payments.receivedAt), desc(payments.id))
        .limit(q.take)
        .all();

      return rows.map((r) => ({
        id: r.id,
        type: "payment" as const,
        at: r.receivedAt,
        summary: `Payment ${r.receiptNo ?? ""}: ${formatRupees(r.amountPaise)} (${r.mode})`.trim(),
        actorName: r.actorName ?? null,
        status: "received",
        href: `/app/bills?payment=${r.id}`,
      }));
    },
  };
}

export function refundHistorySource(db: Db): HistorySource {
  return {
    async list(q: HistorySourceQuery): Promise<HistoryFeedEntry[]> {
      const rows = await db
        .select({
          id: refunds.id,
          approvedAt: refunds.approvedAt,
          amountPaise: refunds.amountPaise,
          mode: refunds.mode,
          refundNo: refunds.refundNo,
          actorName: users.name,
        })
        .from(refunds)
        .leftJoin(users, eq(users.id, refunds.approvedBy))
        .where(
          and(
            eq(refunds.patientId, q.patientId),
            isNull(refunds.deletedAt),
            q.after
              ? or(
                  lt(refunds.approvedAt, q.after.at),
                  and(eq(refunds.approvedAt, q.after.at), lt(refunds.id, q.after.id)),
                )
              : undefined,
          ),
        )
        .orderBy(desc(refunds.approvedAt), desc(refunds.id))
        .limit(q.take)
        .all();

      return rows.map((r) => ({
        id: r.id,
        type: "refund" as const,
        at: r.approvedAt,
        summary: `Refund ${r.refundNo ?? ""}: ${formatRupees(r.amountPaise)} (${r.mode})`.trim(),
        actorName: r.actorName ?? null,
        status: "refunded",
        href: `/app/bills?refund=${r.id}`,
      }));
    },
  };
}
