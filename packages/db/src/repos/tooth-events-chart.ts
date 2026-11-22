import { chartFromEvents, istDate, type ChartCell } from "@clinic/shared";
import { and, asc, desc, eq, isNotNull, isNull, lte } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { toothEvents, visits } from "../schema";

export type ChartHistoryVisit = {
  id: string;
  visitDateLocal: string;
  finalisedAt: string;
};

export type PatientChart = {
  cells: ChartCell[];
  rowsRead: number;
  asOfVisitId: string | null;
  history: ChartHistoryVisit[];
};

function markChangedToday(cells: ChartCell[], todayLocal: string, draftVisitId?: string | null) {
  return cells.map((c) => ({
    ...c,
    changedToday:
      istDate(new Date(c.notedAt)) === todayLocal || (!!draftVisitId && c.visitId === draftVisitId),
  }));
}

/** 3.4.5: current or historical chart; history list for the as-of dropdown. */
export function toothEventsChartRepo(db: Db, ctx: Ctx) {
  return {
    async chartForPatient(
      patientId: string,
      opts: { asOfVisitId?: string | null; highlightVisitId?: string | null } = {},
    ): Promise<PatientChart> {
      assertAllowed(ctx, "clinical.view");

      let asOf: string | null = null;
      let asOfVisitId: string | null = null;
      if (opts.asOfVisitId) {
        const visit = await db
          .select({
            id: visits.id,
            patientId: visits.patientId,
            status: visits.status,
            finalisedAt: visits.finalisedAt,
          })
          .from(visits)
          .where(and(eq(visits.id, opts.asOfVisitId), isNull(visits.deletedAt)))
          .get();
        if (!visit || visit.patientId !== patientId) throw new NotFoundError("That visit");
        if (visit.status !== "final" || !visit.finalisedAt) {
          throw new InvalidError("Pick a finalised visit to see the old chart.");
        }
        asOf = visit.finalisedAt;
        asOfVisitId = visit.id;
      }

      const where = asOf
        ? and(
            eq(toothEvents.patientId, patientId),
            isNull(toothEvents.deletedAt),
            lte(toothEvents.notedAt, asOf),
          )
        : and(eq(toothEvents.patientId, patientId), isNull(toothEvents.deletedAt));

      const rows = await db
        .select({
          id: toothEvents.id,
          toothFdi: toothEvents.toothFdi,
          surface: toothEvents.surface,
          conditionCode: toothEvents.conditionCode,
          notedAt: toothEvents.notedAt,
          visitId: toothEvents.visitId,
        })
        .from(toothEvents)
        .where(where)
        .orderBy(asc(toothEvents.notedAt), asc(toothEvents.id));

      const history = await db
        .select({
          id: visits.id,
          visitDateLocal: visits.visitDateLocal,
          finalisedAt: visits.finalisedAt,
        })
        .from(visits)
        .where(
          and(
            eq(visits.patientId, patientId),
            eq(visits.status, "final"),
            isNotNull(visits.finalisedAt),
            isNull(visits.deletedAt),
          ),
        )
        .orderBy(desc(visits.finalisedAt));

      const cells = markChangedToday(
        chartFromEvents(
          rows.map((r) => ({
            id: r.id,
            toothFdi: r.toothFdi,
            surface: r.surface,
            conditionCode: r.conditionCode,
            notedAt: r.notedAt,
            visitId: r.visitId,
          })),
        ),
        istDate(new Date()),
        asOfVisitId ? null : opts.highlightVisitId,
      );

      return {
        cells,
        rowsRead: rows.length,
        asOfVisitId,
        history: history.map((h) => ({
          id: h.id,
          visitDateLocal: h.visitDateLocal,
          finalisedAt: h.finalisedAt!,
        })),
      };
    },
  };
}
