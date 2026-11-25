import {
  actionForFileKind,
  billStateWord,
  type FileKind,
  istDate,
  NEXT_APPOINTMENT_STATUSES,
  pickNextAppointment,
  type BillStateWord,
} from "@clinic/shared";
import { and, asc, desc, eq, gte, inArray, isNull, ne, sql } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { NotFoundError } from "../errors";
import { assertAllowed, isAllowed } from "../permissions";
import {
  appointments,
  bills,
  files,
  planItems,
  prescriptions,
  visitDiagnoses,
  visitProcedures,
  visits,
} from "../schema";
import { issuedBillPaidSql } from "./bills-paid";
import { parseSurfaces } from "./visit-line-parts";

const OPEN_PLAN_STATUSES = ["planned", "accepted", "in_progress", "deferred"] as const;
const FILES_SHOWN = 20;

export type VisitAfter = {
  visit: { id: string; patientId: string; status: string; visitDateLocal: string; version: number };
  /** Names only, no fees (owner decision): the money is in `bill`. */
  diagnoses: { id: string; label: string; toothFdi: number | null }[];
  procedures: { id: string; label: string; toothFdi: number | null; surfaces: string[] }[];
  nextAppointment: {
    id: string;
    dateLocal: string;
    startMin: number;
    visitTypeLabel: string;
  } | null;
  /** Plan items still open, "left" = sittings - sittingsDone. */
  openPlanItems: {
    id: string;
    toothFdi: number | null;
    procedureLabel: string;
    status: string;
    sittings: number;
    sittingsDone: number;
  }[];
  /** Follow-up date written on the prescription of THIS visit (latest issued one). */
  followUpOn: string | null;
  /** Files added since this visit was opened. */
  filesAdded: {
    id: string;
    kind: string;
    originalFilename: string;
    toothFdi: number | null;
    createdAt: string;
  }[];
  /** Dues of the patient's OTHER bills (what was owed before this visit), in paise. */
  earlierDuesPaise: number;
  /** The visit's live bill, or null. `state` is the one rule from packages/shared/bill-state.ts. */
  bill: {
    id: string;
    version: number;
    status: string;
    billNo: string | null;
    totalPaise: number;
    discountPaise: number;
    discountApproved: boolean;
    notes: string;
    paidPaise: number;
    duePaise: number;
  } | null;
  billState: BillStateWord;
};

// Visit finished page: what the doctor wants beside the prescription. One visit read (it names the
// patient) then ONE db.batch of 8 reads: 9 queries, two round trips. Doctor only (clinical.view).
export function visitAfterRepo(db: Db, ctx: Ctx) {
  return {
    async get(visitId: string, now: Date = new Date()): Promise<VisitAfter> {
      assertAllowed(ctx, "clinical.view");
      const visit = await db
        .select({
          id: visits.id,
          patientId: visits.patientId,
          status: visits.status,
          visitDateLocal: visits.visitDateLocal,
          version: visits.version,
          createdAt: visits.createdAt,
        })
        .from(visits)
        .where(and(eq(visits.id, visitId), isNull(visits.deletedAt)))
        .get();
      if (!visit) throw new NotFoundError("That visit");
      const patientId = visit.patientId;
      const today = istDate(now);

      const [diagnoses, procedures, candidates, plan, rx, fileRows, billRows, money] =
        await db.batch([
          db
            .select({
              id: visitDiagnoses.id,
              label: visitDiagnoses.label,
              toothFdi: visitDiagnoses.toothFdi,
            })
            .from(visitDiagnoses)
            .where(and(eq(visitDiagnoses.visitId, visitId), isNull(visitDiagnoses.deletedAt)))
            .orderBy(asc(visitDiagnoses.sortOrder), asc(visitDiagnoses.createdAt)),
          db
            .select({
              id: visitProcedures.id,
              label: visitProcedures.label,
              toothFdi: visitProcedures.toothFdi,
              surfacesJson: visitProcedures.surfacesJson,
            })
            .from(visitProcedures)
            .where(and(eq(visitProcedures.visitId, visitId), isNull(visitProcedures.deletedAt)))
            .orderBy(asc(visitProcedures.sortOrder), asc(visitProcedures.createdAt)),
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
            .orderBy(asc(planItems.phase), asc(planItems.createdAt))
            .limit(30),
          db
            .select({ followUpOn: prescriptions.followUpOn })
            .from(prescriptions)
            .where(
              and(
                eq(prescriptions.visitId, visitId),
                inArray(prescriptions.status, ["issued", "revised"]),
                isNull(prescriptions.deletedAt),
              ),
            )
            .orderBy(desc(prescriptions.issuedAt), desc(prescriptions.id))
            .limit(1),
          db
            .select({
              id: files.id,
              kind: files.kind,
              originalFilename: files.originalFilename,
              toothFdi: files.toothFdi,
              createdAt: files.createdAt,
            })
            .from(files)
            .where(
              and(
                eq(files.patientId, patientId),
                gte(files.createdAt, visit.createdAt),
                isNull(files.deletedAt),
              ),
            )
            .orderBy(desc(files.createdAt), desc(files.id))
            .limit(FILES_SHOWN),
          db
            .select({
              id: bills.id,
              version: bills.version,
              status: bills.status,
              billNo: bills.billNo,
              totalPaise: bills.totalPaise,
              discountPaise: bills.discountPaise,
              discountApprovedBy: bills.discountApprovedBy,
              notes: bills.notes,
            })
            .from(bills)
            .where(
              and(
                eq(bills.visitId, visitId),
                ne(bills.status, "cancelled"),
                isNull(bills.deletedAt),
              ),
            )
            .limit(1),
          // Two scalars in one query (the bills subselects repeat the live-bill condition of the unique index 0063): what the patient owed on OTHER bills, and what is still due
          // on THIS visit's bill (issued bills only; a draft has nothing paid).
          db
            .select({
              earlier: sql<number | null>`(${issuedBillPaidSql(patientId)}
                SELECT SUM(due) FROM open_bills WHERE due > 0
                AND id NOT IN (SELECT id FROM bills WHERE visit_id = ${visitId}
                  AND status != 'cancelled' AND deleted_at IS NULL))`,
              mine: sql<number | null>`(${issuedBillPaidSql(patientId)}
                SELECT SUM(due) FROM open_bills
                WHERE id IN (SELECT id FROM bills WHERE visit_id = ${visitId}
                  AND status != 'cancelled' AND deleted_at IS NULL))`,
            })
            .from(visits)
            .where(eq(visits.id, visitId)),
        ]);

      const next = pickNextAppointment(candidates, now);
      const b = billRows[0];
      const issued = b?.status === "issued";
      const due = issued ? Number(money[0]?.mine ?? 0) : (b?.totalPaise ?? 0);
      const paid = issued ? Math.max(0, (b?.totalPaise ?? 0) - due) : 0;
      const canSeeFile = (kind: FileKind) => {
        const action = actionForFileKind(kind);
        return action ? isAllowed(ctx.role, action) : false;
      };

      return {
        visit: {
          id: visit.id,
          patientId,
          status: visit.status,
          visitDateLocal: visit.visitDateLocal,
          version: visit.version,
        },
        diagnoses,
        procedures: procedures.map((p) => ({
          id: p.id,
          label: p.label,
          toothFdi: p.toothFdi,
          surfaces: parseSurfaces(p.surfacesJson),
        })),
        nextAppointment: next
          ? {
              id: next.id,
              dateLocal: next.dateLocal,
              startMin: next.startMin,
              visitTypeLabel: next.visitTypeLabel,
            }
          : null,
        openPlanItems: plan,
        followUpOn: rx[0]?.followUpOn ?? null,
        filesAdded: fileRows.filter((f) => canSeeFile(f.kind)),
        earlierDuesPaise: Number(money[0]?.earlier ?? 0),
        bill: b
          ? {
              id: b.id,
              version: b.version,
              status: b.status,
              billNo: b.billNo,
              totalPaise: b.totalPaise,
              discountPaise: b.discountPaise,
              discountApproved: b.discountApprovedBy !== null,
              notes: b.notes,
              paidPaise: paid,
              duePaise: due,
            }
          : null,
        billState: billStateWord(b ? { status: b.status, totalPaise: b.totalPaise } : null, paid),
      };
    },
  };
}
