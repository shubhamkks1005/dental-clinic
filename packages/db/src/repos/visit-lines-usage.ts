import { istDate } from "@clinic/shared";
import { and, eq, gte, isNull, ne, sql } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { assertAllowed } from "../permissions";
import { visitDiagnoses, visitProcedures, visits } from "../schema";

const DAYS = 30;

// Design 30: the diagnosis and procedure search shows "popular" ones first. Counts only, no
// patient: how many lines carried each name in visits of the last 30 days, by lower-case label.
export function visitLinesUsageRepo(db: Db, ctx: Ctx) {
  return {
    async diagnosisProcedureUsage30d(now: Date = new Date()): Promise<{
      diagnoses: Record<string, number>;
      procedures: Record<string, number>;
    }> {
      assertAllowed(ctx, "clinical.edit");
      const since = istDate(new Date(now.getTime() - DAYS * 86_400_000));
      const visitOk = and(
        gte(visits.visitDateLocal, since),
        ne(visits.status, "void"),
        isNull(visits.deletedAt),
      );
      const [d, p] = await db.batch([
        db
          .select({
            name: sql<string>`lower(${visitDiagnoses.label})`,
            n: sql<number>`count(*)`,
          })
          .from(visitDiagnoses)
          .innerJoin(visits, eq(visits.id, visitDiagnoses.visitId))
          .where(and(visitOk, isNull(visitDiagnoses.deletedAt)))
          .groupBy(sql`lower(${visitDiagnoses.label})`),
        db
          .select({
            name: sql<string>`lower(${visitProcedures.label})`,
            n: sql<number>`count(*)`,
          })
          .from(visitProcedures)
          .innerJoin(visits, eq(visits.id, visitProcedures.visitId))
          .where(and(visitOk, isNull(visitProcedures.deletedAt)))
          .groupBy(sql`lower(${visitProcedures.label})`),
      ]);
      const toMap = (rows: { name: string; n: number }[]) =>
        Object.fromEntries(rows.map((r) => [r.name, Number(r.n)]));
      return { diagnoses: toMap(d), procedures: toMap(p) };
    },
  };
}
