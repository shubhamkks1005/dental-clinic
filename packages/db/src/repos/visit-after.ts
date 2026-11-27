import {
  actionForFileKind,
  billStateWord,
  type FileKind,
  istDate,
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
  bills,
  paymentAllocations,
  payments,
  refunds,
  users,
  files,
  planItems,
  prescriptions,
  visitDiagnoses,
  visitProcedures,
  visits,
} from "../schema";
import { issuedBillPaidSql } from "./bills-paid";
import { arrivalOf, parseFee, type VisitAfter } from "./visit-after-parts";
import { parseSurfaces } from "./visit-line-parts";

export type { VisitAfter } from "./visit-after-parts";

const OPEN_PLAN_STATUSES = ["planned", "accepted", "in_progress", "deferred"] as const;
const FILES_SHOWN = 20;

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
          doctorId: visits.doctorId,
          finalisedAt: visits.finalisedAt,
        })
        .from(visits)
        .where(and(eq(visits.id, visitId), isNull(visits.deletedAt)))
        .get();
      if (!visit) throw new NotFoundError("That visit");
      const patientId = visit.patientId;
      const today = istDate(now);

      const [diagnoses, procedures, candidates, plan, rx, fileRows, billRows, money, arrivalRows] =
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
              consultFee: sql<string | null>`(SELECT value_json FROM settings
                WHERE key = 'billing.consultation_fee_paise' AND deleted_at IS NULL LIMIT 1)`,
            })
            .from(visits)
            .where(eq(visits.id, visitId)),
          // "Paid at arrival": this patient's payments of the visit day with what is still unused.
          db
            .select({
              paymentId: payments.id,
              amountPaise: payments.amountPaise,
              mode: payments.mode,
              reference: payments.reference,
              notes: payments.notes,
              receivedAt: payments.receivedAt,
              receivedByName: sql<string>`coalesce(${users.name}, '')`,
              allocated: sql<number>`(SELECT coalesce(sum(${paymentAllocations.amountPaise}), 0)
                FROM ${paymentAllocations} WHERE ${paymentAllocations.paymentId} = ${payments.id}
                AND ${paymentAllocations.deletedAt} IS NULL)`,
              refunded: sql<number>`(SELECT coalesce(sum(${refunds.amountPaise}), 0)
                FROM ${refunds} WHERE ${refunds.paymentId} = ${payments.id}
                AND ${refunds.deletedAt} IS NULL)`,
            })
            .from(payments)
            .leftJoin(users, eq(users.id, payments.receivedBy))
            .where(
              and(
                eq(payments.patientId, patientId),
                eq(payments.dayLocal, visit.visitDateLocal),
                isNull(payments.deletedAt),
              ),
            )
            .orderBy(asc(payments.receivedAt))
            .limit(20),
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
          finalisedAt: visit.finalisedAt,
          doctorId: visit.doctorId,
          version: visit.version,
        },
        consultationFeePaise: parseFee(money[0]?.consultFee ?? null),
        arrival: arrivalOf(arrivalRows),
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
