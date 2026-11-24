import { and, eq, gte, isNull, ne, sql } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { assertAllowed } from "../permissions";
import { prescriptionItems, prescriptions } from "../schema";

const DAYS = 30;

export function prescriptionsUsageRepo(db: Db, ctx: Ctx) {
  return {
    /**
     * Library "used, 30 days": how many prescriptions (not draft) carried each medicine in the last
     * 30 days, by lower-case generic name. Counts only, no patient. Doctor only (clinical list).
     */
    async medicineUsage30d(): Promise<Record<string, number>> {
      assertAllowed(ctx, "prescriptions.write");
      const since = new Date(Date.now() - DAYS * 86_400_000).toISOString();
      const rows = await db
        .select({
          name: sql<string>`lower(${prescriptionItems.genericName})`,
          n: sql<number>`count(distinct ${prescriptionItems.prescriptionId})`,
        })
        .from(prescriptionItems)
        .innerJoin(prescriptions, eq(prescriptionItems.prescriptionId, prescriptions.id))
        .where(
          and(
            ne(prescriptions.status, "draft"),
            gte(prescriptions.createdAt, since),
            isNull(prescriptions.deletedAt),
            isNull(prescriptionItems.deletedAt),
          ),
        )
        .groupBy(sql`lower(${prescriptionItems.genericName})`)
        .all();
      return Object.fromEntries(rows.map((r) => [r.name, Number(r.n)]));
    },
  };
}
