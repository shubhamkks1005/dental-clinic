import { inChunks, issuedBillPaidSql, paidByBill } from "./bills-paid";
import { daysBetweenOn, dueAgeBucket, istDate, type DueAgeBucket } from "@clinic/shared";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { assertAllowed } from "../permissions";
import { bills, duesCalls } from "../schema";
import { deskMarksByAppointment, readyToBillByAppointment } from "./bills-ready";

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

  const open = await inChunks(patientIds, (part) =>
    db
      .select({
        id: bills.id,
        patientId: bills.patientId,
        totalPaise: bills.totalPaise,
      })
      .from(bills)
      .where(
        and(inArray(bills.patientId, part), eq(bills.status, "issued"), isNull(bills.deletedAt)),
      )
      .all(),
  );
  if (open.length === 0) return out;

  const ids = open.map((b) => b.id);
  const paidMap = await paidByBill(db, ids);

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

      // One query, no id list: per patient due (bills with due > 0 only) and oldest such bill.
      const found = await db.all<{
        patientId: string;
        patientCode: string;
        patientName: string;
        duePaise: number;
        oldestBillOn: string;
      }>(sql`${issuedBillPaidSql()}
        SELECT o.patient_id AS patientId, p.code AS patientCode, p.full_name AS patientName,
          SUM(o.due) AS duePaise, MIN(o.bill_on) AS oldestBillOn
        FROM open_bills o
        JOIN patients p ON p.id = o.patient_id AND p.deleted_at IS NULL
        WHERE o.due > 0
        GROUP BY o.patient_id`);

      const byPatient = new Map(
        found.map((f) => [f.patientId, { ...f, duePaise: Number(f.duePaise) }]),
      );

      const patientIds = [...byPatient.keys()];
      const lastCalls = new Map<string, { note: string; calledOn: string }>();
      if (patientIds.length > 0) {
        const callRows = await inChunks(patientIds, (part) =>
          db
            .select({
              patientId: duesCalls.patientId,
              note: duesCalls.note,
              calledOn: duesCalls.calledOn,
              createdAt: duesCalls.createdAt,
            })
            .from(duesCalls)
            .where(and(inArray(duesCalls.patientId, part), isNull(duesCalls.deletedAt)))
            .orderBy(desc(duesCalls.createdAt))
            .all(),
        );
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

    async readyToBill(appointmentIds: string[]) {
      assertAllowed(ctx, "bills.create");
      return readyToBillByAppointment(db, appointmentIds);
    },

    /** Desk Today marks in one read: ready to bill + prescription to print. */
    async deskMarks(appointmentIds: string[]) {
      assertAllowed(ctx, "bills.create");
      return deskMarksByAppointment(db, appointmentIds);
    },
  };
}
