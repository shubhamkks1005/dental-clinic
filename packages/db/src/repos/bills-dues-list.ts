import { daysBetweenOn, dueAgeBucket, istDate, type DueAgeBucket } from "@clinic/shared";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { assertAllowed } from "../permissions";
import { bills, duesCalls, patients, paymentAllocations } from "../schema";

export type DuesListRow = {
  patientId: string;
  patientCode: string;
  patientName: string;
  duePaise: number;
  oldestBillOn: string;
  daysOutstanding: number;
  bucket: DueAgeBucket;
  lastCallNote: string | null;
  lastCallOn: string | null;
};

/** Outstanding due per patient (issued bills − allocations). */
export async function duesByPatientIds(db: Db, patientIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (patientIds.length === 0) return out;

  const open = await db
    .select({
      id: bills.id,
      patientId: bills.patientId,
      totalPaise: bills.totalPaise,
    })
    .from(bills)
    .where(
      and(
        inArray(bills.patientId, patientIds),
        eq(bills.status, "issued"),
        isNull(bills.deletedAt),
      ),
    )
    .all();
  if (open.length === 0) return out;

  const ids = open.map((b) => b.id);
  const paidRows = await db
    .select({
      billId: paymentAllocations.billId,
      paid: sql<number>`coalesce(sum(${paymentAllocations.amountPaise}), 0)`,
    })
    .from(paymentAllocations)
    .where(and(inArray(paymentAllocations.billId, ids), isNull(paymentAllocations.deletedAt)))
    .groupBy(paymentAllocations.billId)
    .all();
  const paidMap = new Map(paidRows.map((r) => [r.billId, Number(r.paid)]));

  for (const b of open) {
    const due = b.totalPaise - (paidMap.get(b.id) ?? 0);
    if (due <= 0) continue;
    out.set(b.patientId, (out.get(b.patientId) ?? 0) + due);
  }
  return out;
}

export function billsDuesListRepo(db: Db, ctx: Ctx) {
  return {
    async listDues(asOf: Date = new Date()): Promise<{
      rows: DuesListRow[];
      totalDuePaise: number;
      byBucket: Record<DueAgeBucket, number>;
    }> {
      assertAllowed(ctx, "bills.create");
      const today = istDate(asOf);

      const open = await db
        .select({
          id: bills.id,
          patientId: bills.patientId,
          billOn: bills.billOn,
          totalPaise: bills.totalPaise,
          patientCode: patients.code,
          patientName: patients.fullName,
        })
        .from(bills)
        .innerJoin(patients, eq(bills.patientId, patients.id))
        .where(and(eq(bills.status, "issued"), isNull(bills.deletedAt), isNull(patients.deletedAt)))
        .all();

      if (open.length === 0) {
        return {
          rows: [],
          totalDuePaise: 0,
          byBucket: { "0-30": 0, "31-60": 0, "61+": 0 },
        };
      }

      const ids = open.map((b) => b.id);
      const paidRows = await db
        .select({
          billId: paymentAllocations.billId,
          paid: sql<number>`coalesce(sum(${paymentAllocations.amountPaise}), 0)`,
        })
        .from(paymentAllocations)
        .where(and(inArray(paymentAllocations.billId, ids), isNull(paymentAllocations.deletedAt)))
        .groupBy(paymentAllocations.billId)
        .all();
      const paidMap = new Map(paidRows.map((r) => [r.billId, Number(r.paid)]));

      type Acc = {
        patientId: string;
        patientCode: string;
        patientName: string;
        duePaise: number;
        oldestBillOn: string;
      };
      const byPatient = new Map<string, Acc>();
      for (const b of open) {
        const due = b.totalPaise - (paidMap.get(b.id) ?? 0);
        if (due <= 0) continue;
        const cur = byPatient.get(b.patientId);
        if (!cur) {
          byPatient.set(b.patientId, {
            patientId: b.patientId,
            patientCode: b.patientCode,
            patientName: b.patientName,
            duePaise: due,
            oldestBillOn: b.billOn,
          });
        } else {
          cur.duePaise += due;
          if (b.billOn < cur.oldestBillOn) cur.oldestBillOn = b.billOn;
        }
      }

      const patientIds = [...byPatient.keys()];
      const lastCalls = new Map<string, { note: string; calledOn: string }>();
      if (patientIds.length > 0) {
        const callRows = await db
          .select({
            patientId: duesCalls.patientId,
            note: duesCalls.note,
            calledOn: duesCalls.calledOn,
            createdAt: duesCalls.createdAt,
          })
          .from(duesCalls)
          .where(and(inArray(duesCalls.patientId, patientIds), isNull(duesCalls.deletedAt)))
          .orderBy(desc(duesCalls.createdAt))
          .all();
        for (const c of callRows) {
          if (!lastCalls.has(c.patientId)) {
            lastCalls.set(c.patientId, { note: c.note, calledOn: c.calledOn });
          }
        }
      }

      const byBucket: Record<DueAgeBucket, number> = { "0-30": 0, "31-60": 0, "61+": 0 };
      const rows: DuesListRow[] = [];
      let totalDuePaise = 0;
      for (const acc of byPatient.values()) {
        const daysOutstanding = Math.max(0, daysBetweenOn(acc.oldestBillOn, today));
        const bucket = dueAgeBucket(daysOutstanding);
        const last = lastCalls.get(acc.patientId);
        byBucket[bucket] += acc.duePaise;
        totalDuePaise += acc.duePaise;
        rows.push({
          ...acc,
          daysOutstanding,
          bucket,
          lastCallNote: last?.note ?? null,
          lastCallOn: last?.calledOn ?? null,
        });
      }
      rows.sort((a, b) => b.daysOutstanding - a.daysOutstanding || b.duePaise - a.duePaise);

      return { rows, totalDuePaise, byBucket };
    },

    async duesForPatients(patientIds: string[]): Promise<Map<string, number>> {
      assertAllowed(ctx, "bills.create");
      return duesByPatientIds(db, patientIds);
    },
  };
}
