import { istDate, NEXT_APPOINTMENT_STATUSES, pickNextAppointment } from "@clinic/shared";
import { and, asc, count, eq, gte, inArray, isNull, max, min, ne } from "drizzle-orm";
import { accessInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { NotFoundError } from "../errors";
import { assertAllowed, isAllowed } from "../permissions";
import { alerts, appointments, patients, visits } from "../schema";
import { openBillDues } from "./bills-dues";

export type HistorySummary = {
  firstVisitDate: string | null;
  lastVisitDate: string | null;
  totalVisits: number;
  /** Doctor: alert labels. Receptionist: empty (use flags only). */
  alertLabels: string[];
  hasAlert: boolean;
  hasRestricted: boolean;
  /** Paise. Sum of open issued-bill dues (5.3.16). */
  outstandingDuePaise: number;
  nextAppointment: {
    id: string;
    dateLocal: string;
    startMin: number;
    visitTypeLabel: string;
  } | null;
};

// 3.5.11: pinned History strip. Views go to access_log (audit_log is create/update/delete only).
export function historySummaryRepo(db: Db, ctx: Ctx) {
  return {
    async getSummary(patientId: string): Promise<HistorySummary> {
      assertAllowed(ctx, "patients.view");
      const patient = await db
        .select({ id: patients.id })
        .from(patients)
        .where(and(eq(patients.id, patientId), isNull(patients.deletedAt)))
        .get();
      if (!patient) throw new NotFoundError("That patient");

      const visitAgg = await db
        .select({
          total: count(),
          first: min(visits.visitDateLocal),
          last: max(visits.visitDateLocal),
        })
        .from(visits)
        .where(
          and(eq(visits.patientId, patientId), isNull(visits.deletedAt), ne(visits.status, "void")),
        )
        .get();

      const today = istDate(new Date());
      const candidates = await db
        .select({
          id: appointments.id,
          status: appointments.status,
          dateLocal: appointments.dateLocal,
          startMin: appointments.startMin,
          visitTypeLabel: appointments.visitTypeLabel,
        })
        .from(appointments)
        .where(
          and(
            eq(appointments.patientId, patientId),
            isNull(appointments.deletedAt),
            gte(appointments.dateLocal, today),
            inArray(appointments.status, [...NEXT_APPOINTMENT_STATUSES]),
          ),
        )
        .orderBy(asc(appointments.dateLocal), asc(appointments.startMin))
        .limit(20)
        .all();

      // Q1.8: the one shared rule (not started, in the future).
      const next = pickNextAppointment(candidates, new Date());

      const alertRows = await db
        .select({ label: alerts.label, restricted: alerts.restricted })
        .from(alerts)
        .where(
          and(eq(alerts.patientId, patientId), eq(alerts.active, true), isNull(alerts.deletedAt)),
        )
        .all();

      const hasAlert = alertRows.length > 0;
      const hasRestricted = alertRows.some((a) => a.restricted);
      const canSeeClinical = isAllowed(ctx.role, "clinical.view");
      const alertLabels = canSeeClinical
        ? alertRows.map((a) => a.label).filter((l) => l.trim().length > 0)
        : [];

      const dues = await openBillDues(db, patientId);
      const outstandingDuePaise = dues.reduce((s, d) => s + d.duePaise, 0);

      await accessInsert(db, ctx, {
        action: "view",
        resource: "patient_history",
        resourceId: patientId,
        detail: "history summary",
      });

      return {
        firstVisitDate: (visitAgg?.first as string | null) ?? null,
        lastVisitDate: (visitAgg?.last as string | null) ?? null,
        totalVisits: Number(visitAgg?.total ?? 0),
        alertLabels,
        hasAlert,
        hasRestricted,
        outstandingDuePaise,
        nextAppointment: next
          ? {
              id: next.id,
              dateLocal: next.dateLocal,
              startMin: next.startMin,
              visitTypeLabel: next.visitTypeLabel,
            }
          : null,
      };
    },
  };
}
