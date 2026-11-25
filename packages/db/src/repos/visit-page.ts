import {
  actionForFileKind,
  followUpStatus,
  istDate,
  type FollowUpStatus,
  NEXT_APPOINTMENT_STATUSES,
  pickNextAppointment,
} from "@clinic/shared";
import { and, asc, desc, eq, gte, inArray, isNull, ne, sql } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { NotFoundError } from "../errors";
import { assertAllowed, isAllowed } from "../permissions";
import {
  appointments,
  files,
  planItems,
  prescriptionItems,
  prescriptions,
  visitAddenda,
  visitDiagnoses,
  visitProcedures,
  visits,
} from "../schema";
import { issuedBillPaidSql } from "./bills-paid";
import { visitDetailCols, type VisitDetail } from "./visits-get";

const OPEN_PLAN_STATUSES = ["planned", "accepted", "in_progress", "deferred"] as const;
const LAST_VISITS = 3;
const FILES_SHOWN = 12;

export type VisitPage = {
  visit: VisitDetail & {
    diagnoses: {
      id: string;
      version: number;
      listItemId: string | null;
      label: string;
      toothFdi: number | null;
      sortOrder: number;
    }[];
    procedures: {
      id: string;
      version: number;
      listItemId: string | null;
      label: string;
      toothFdi: number | null;
      surfacesJson: string;
      note: string | null;
      moreSittings: boolean;
      defaultPaise: number | null;
      sortOrder: number;
    }[];
    addenda: { id: string; kind: string; body: string; reason: string; recordedAt: string }[];
  };
  /** For the "From plan: ..." tag on a procedure line (shown only when tooth and name match). */
  openPlanItems: {
    id: string;
    toothFdi: number | null;
    procedureLabel: string;
    status: string;
    sittings: number;
    /** Sittings already done; left = sittings - sittingsDone (never below 0). */
    sittingsDone: number;
  }[];
  /** Newest first, this visit left out. */
  lastVisits: {
    id: string;
    visitDateLocal: string;
    status: string;
    chiefComplaint: string | null;
    examNote: string | null;
  }[];
  nextAppointment: {
    id: string;
    dateLocal: string;
    startMin: number;
    visitTypeLabel: string;
  } | null;
  /** Paise still owed on issued bills (refunds re-open the due). */
  duesPaise: number;
  files: {
    id: string;
    kind: string;
    originalFilename: string;
    caption: string | null;
    toothFdi: number | null;
    takenOn: string | null;
    createdAt: string;
    hasThumb: boolean;
  }[];
  /** Medicines of the latest issued prescription. */
  previousMedicines: {
    rxNo: string | null;
    issuedAt: string | null;
    items: {
      genericName: string;
      brand: string;
      strength: string;
      frequency: string;
      days: string;
    }[];
  } | null;
  /** Strip: is the patient late for the follow-up asked on the latest issued prescription (design 30). */
  followUp: FollowUpStatus | null;
};

// B5: everything the doctor visit page needs in TWO round trips (one read of the visit to learn
// the patient, then one db.batch of 9 reads): 10 queries in all (PLAN Part S: at most 10).
export function visitPageRepo(db: Db, ctx: Ctx) {
  return {
    async get(visitId: string, now: Date = new Date()): Promise<VisitPage> {
      assertAllowed(ctx, "clinical.view");
      const visit = await db
        .select(visitDetailCols)
        .from(visits)
        .where(and(eq(visits.id, visitId), isNull(visits.deletedAt)))
        .get();
      if (!visit) throw new NotFoundError("That visit");
      const patientId = visit.patientId;
      const today = istDate(now);

      const latestRx = sql`(SELECT id FROM prescriptions WHERE patient_id = ${patientId}
        AND status IN ('issued', 'revised') AND deleted_at IS NULL
        ORDER BY issued_at DESC, id DESC LIMIT 1)`;

      const [diagnoses, procedures, addenda, plan, last, candidates, dues, fileRows, rx] =
        await db.batch([
          db
            .select({
              id: visitDiagnoses.id,
              version: visitDiagnoses.version,
              listItemId: visitDiagnoses.listItemId,
              label: visitDiagnoses.label,
              toothFdi: visitDiagnoses.toothFdi,
              sortOrder: visitDiagnoses.sortOrder,
            })
            .from(visitDiagnoses)
            .where(and(eq(visitDiagnoses.visitId, visitId), isNull(visitDiagnoses.deletedAt)))
            .orderBy(asc(visitDiagnoses.sortOrder), asc(visitDiagnoses.createdAt)),
          db
            .select({
              id: visitProcedures.id,
              version: visitProcedures.version,
              listItemId: visitProcedures.listItemId,
              label: visitProcedures.label,
              toothFdi: visitProcedures.toothFdi,
              surfacesJson: visitProcedures.surfacesJson,
              note: visitProcedures.note,
              moreSittings: visitProcedures.moreSittings,
              defaultPaise: visitProcedures.defaultPaise,
              sortOrder: visitProcedures.sortOrder,
            })
            .from(visitProcedures)
            .where(and(eq(visitProcedures.visitId, visitId), isNull(visitProcedures.deletedAt)))
            .orderBy(asc(visitProcedures.sortOrder), asc(visitProcedures.createdAt)),
          db
            .select({
              id: visitAddenda.id,
              kind: visitAddenda.kind,
              body: visitAddenda.body,
              reason: visitAddenda.reason,
              recordedAt: visitAddenda.recordedAt,
            })
            .from(visitAddenda)
            .where(and(eq(visitAddenda.visitId, visitId), isNull(visitAddenda.deletedAt)))
            .orderBy(asc(visitAddenda.recordedAt)),
          db
            .select({
              id: planItems.id,
              toothFdi: planItems.toothFdi,
              procedureLabel: planItems.procedureLabel,
              status: planItems.status,
              sittings: planItems.sittings,
              sittingsDone: planItems.sittingsDone,
            })
            .from(planItems)
            .where(
              and(
                eq(planItems.patientId, patientId),
                inArray(planItems.status, [...OPEN_PLAN_STATUSES]),
                isNull(planItems.deletedAt),
              ),
            )
            .orderBy(asc(planItems.phase), asc(planItems.createdAt)),
          db
            .select({
              id: visits.id,
              visitDateLocal: visits.visitDateLocal,
              status: visits.status,
              chiefComplaint: visits.chiefComplaint,
              examNote: visits.examNote,
            })
            .from(visits)
            .where(
              and(
                eq(visits.patientId, patientId),
                ne(visits.id, visitId),
                ne(visits.status, "void"),
                isNull(visits.deletedAt),
              ),
            )
            .orderBy(desc(visits.visitDateLocal), desc(visits.createdAt))
            .limit(LAST_VISITS),
          db
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
            .limit(20),
          // A scalar subquery, so it can ride in the batch (raw db.all cannot).
          db
            .select({
              due: sql<number | null>`(${issuedBillPaidSql(patientId)}
                SELECT SUM(due) FROM open_bills WHERE patient_id = ${patientId} AND due > 0)`,
            })
            .from(visits)
            .where(eq(visits.id, visitId)),
          db
            .select({
              id: files.id,
              kind: files.kind,
              originalFilename: files.originalFilename,
              caption: files.caption,
              toothFdi: files.toothFdi,
              takenOn: files.takenOn,
              createdAt: files.createdAt,
              thumbKey: files.thumbKey,
            })
            .from(files)
            .where(and(eq(files.patientId, patientId), isNull(files.deletedAt)))
            .orderBy(desc(files.createdAt), desc(files.id))
            .limit(FILES_SHOWN * 2),
          db
            .select({
              rxNo: prescriptions.rxNo,
              issuedAt: prescriptions.issuedAt,
              followUpOn: prescriptions.followUpOn,
              genericName: prescriptionItems.genericName,
              brand: prescriptionItems.brand,
              strength: prescriptionItems.strength,
              frequency: prescriptionItems.frequency,
              days: prescriptionItems.days,
            })
            .from(prescriptionItems)
            .innerJoin(prescriptions, eq(prescriptions.id, prescriptionItems.prescriptionId))
            .where(
              and(
                eq(prescriptionItems.prescriptionId, latestRx),
                isNull(prescriptionItems.deletedAt),
              ),
            )
            .orderBy(asc(prescriptionItems.sortOrder)),
        ]);

      const next = pickNextAppointment(candidates, now);
      const shownFiles = fileRows
        .filter((f) => {
          const action = actionForFileKind(f.kind);
          return action ? isAllowed(ctx.role, action) : false;
        })
        .slice(0, FILES_SHOWN)
        .map(({ thumbKey, ...f }) => ({ ...f, hasThumb: Boolean(thumbKey) }));

      return {
        visit: { ...visit, diagnoses, procedures, addenda },
        openPlanItems: plan,
        lastVisits: last,
        nextAppointment: next
          ? {
              id: next.id,
              dateLocal: next.dateLocal,
              startMin: next.startMin,
              visitTypeLabel: next.visitTypeLabel,
            }
          : null,
        duesPaise: Number(dues[0]?.due ?? 0),
        files: shownFiles,
        followUp: rx[0]
          ? followUpStatus({
              followUpOn: rx[0].followUpOn,
              issuedOn: rx[0].issuedAt ? istDate(new Date(rx[0].issuedAt)) : null,
              medicineDays: rx.map((r) => r.days),
              today,
            })
          : null,
        previousMedicines: rx[0]
          ? {
              rxNo: rx[0].rxNo,
              issuedAt: rx[0].issuedAt,
              items: rx.map((r) => ({
                genericName: r.genericName,
                brand: r.brand,
                strength: r.strength,
                frequency: r.frequency,
                days: r.days,
              })),
            }
          : null,
      };
    },
  };
}
