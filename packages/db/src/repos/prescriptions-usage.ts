import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { assertAllowed } from "../permissions";
import { prescriptionItems, prescriptions } from "../schema";

const DAYS = 30;

export type MedicineUsage = { total: number; last30: number };

export function prescriptionsUsageRepo(db: Db, ctx: Ctx) {
  return {
    /**
     * Library "You wrote this N times (M in the last 30 days)": per lower-case medicine name, how
     * many VISITS got it on an issued or revised prescription written by the signed-in doctor. A
     * revision is a new row for the same visit, so it is counted once (L13); other doctors are not
     * counted (L14). Without a visit, a revision counts with the prescription it revised. Counts
     * only, no patient.
     */
    async medicineUsage(): Promise<Record<string, MedicineUsage>> {
      assertAllowed(ctx, "prescriptions.write");
      const since = new Date(Date.now() - DAYS * 86_400_000).toISOString();
      const visit = sql`coalesce(${prescriptions.visitId}, ${prescriptions.revisedFromId}, ${prescriptions.id})`;
      const rows = await db
        .select({
          name: sql<string>`lower(${prescriptionItems.genericName})`,
          total: sql<number>`count(distinct ${visit})`,
          last30: sql<number>`count(distinct case when ${prescriptions.createdAt} >= ${since} then ${visit} end)`,
        })
        .from(prescriptions)
        .innerJoin(prescriptionItems, eq(prescriptionItems.prescriptionId, prescriptions.id))
        .where(
          and(
            eq(prescriptions.doctorId, ctx.userId),
            inArray(prescriptions.status, ["issued", "revised"]),
            isNull(prescriptions.deletedAt),
            isNull(prescriptionItems.deletedAt),
          ),
        )
        .groupBy(sql`lower(${prescriptionItems.genericName})`)
        .all();
      return Object.fromEntries(
        rows.map((r) => [r.name, { total: Number(r.total), last30: Number(r.last30) }]),
      );
    },
  };
}
