import { displayAge, formatRupees, istDate } from "@clinic/shared";
import { and, asc, desc, eq, inArray, isNull, ne } from "drizzle-orm";
import { accessInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { alerts, patients, planItems, users, visitDiagnoses, visits } from "../schema";

export type HistoryPrintVisit = {
  id: string;
  visitDateLocal: string;
  status: string;
  chiefComplaint: string | null;
  diagnoses: string[];
  doctorName: string | null;
};

export type HistoryPrintTreatment = {
  id: string;
  createdOn: string;
  procedureLabel: string;
  toothFdi: number | null;
  status: string;
  estimateLabel: string;
};

export type HistoryPrintSummary = {
  patient: {
    id: string;
    code: string;
    fullName: string;
    gender: string;
    ageLabel: string;
    mobile: string | null;
  };
  allergies: string[];
  visits: HistoryPrintVisit[];
  treatments: HistoryPrintTreatment[];
};

const PRINT_ROW_CAP = 100;

/** 6.7.2: A4 history summary data (doctor / clinical.view only). */
export function historyPrintSummaryRepo(db: Db, ctx: Ctx) {
  return {
    async getPrintSummary(patientId: string): Promise<HistoryPrintSummary> {
      assertAllowed(ctx, "clinical.view");

      const patient = await db
        .select({
          id: patients.id,
          code: patients.code,
          fullName: patients.fullName,
          gender: patients.gender,
          dateOfBirth: patients.dateOfBirth,
          ageYearsAtReg: patients.ageYearsAtReg,
          mobile: patients.mobile,
          createdAt: patients.createdAt,
        })
        .from(patients)
        .where(and(eq(patients.id, patientId), isNull(patients.deletedAt)))
        .get();
      if (!patient) throw new NotFoundError("That patient");

      const allergyRows = await db
        .select({ label: alerts.label })
        .from(alerts)
        .where(
          and(eq(alerts.patientId, patientId), eq(alerts.active, true), isNull(alerts.deletedAt)),
        )
        .all();
      const allergies = allergyRows.map((a) => a.label).filter((l) => l.trim().length > 0);

      const visitRows = await db
        .select({
          id: visits.id,
          visitDateLocal: visits.visitDateLocal,
          status: visits.status,
          chiefComplaint: visits.chiefComplaint,
          doctorName: users.name,
        })
        .from(visits)
        .leftJoin(users, eq(users.id, visits.doctorId))
        .where(
          and(eq(visits.patientId, patientId), isNull(visits.deletedAt), ne(visits.status, "void")),
        )
        .orderBy(desc(visits.visitDateLocal), desc(visits.createdAt))
        .limit(PRINT_ROW_CAP)
        .all();

      const dxByVisit = new Map<string, string[]>();
      if (visitRows.length > 0) {
        const dxRows = await db
          .select({
            visitId: visitDiagnoses.visitId,
            label: visitDiagnoses.label,
            sortOrder: visitDiagnoses.sortOrder,
          })
          .from(visitDiagnoses)
          .where(
            and(
              inArray(
                visitDiagnoses.visitId,
                visitRows.map((v) => v.id),
              ),
              isNull(visitDiagnoses.deletedAt),
            ),
          )
          .orderBy(asc(visitDiagnoses.sortOrder))
          .all();
        for (const d of dxRows) {
          const list = dxByVisit.get(d.visitId) ?? [];
          list.push(d.label);
          dxByVisit.set(d.visitId, list);
        }
      }

      const treatmentRows = await db
        .select({
          id: planItems.id,
          createdAt: planItems.createdAt,
          procedureLabel: planItems.procedureLabel,
          toothFdi: planItems.toothFdi,
          status: planItems.status,
          estimatePaise: planItems.estimatePaise,
        })
        .from(planItems)
        .where(and(eq(planItems.patientId, patientId), isNull(planItems.deletedAt)))
        .orderBy(desc(planItems.createdAt), desc(planItems.id))
        .limit(PRINT_ROW_CAP)
        .all();

      await accessInsert(db, ctx, {
        action: "view",
        resource: "patient_history",
        resourceId: patientId,
        detail: "history print summary",
      });

      const today = istDate(new Date());
      return {
        patient: {
          id: patient.id,
          code: patient.code,
          fullName: patient.fullName,
          gender: patient.gender,
          ageLabel: displayAge(
            {
              dateOfBirth: patient.dateOfBirth,
              ageYearsAtReg: patient.ageYearsAtReg,
              registeredOn: istDate(new Date(patient.createdAt)),
            },
            today,
          ),
          mobile: patient.mobile,
        },
        allergies,
        visits: visitRows.map((v) => ({
          id: v.id,
          visitDateLocal: v.visitDateLocal,
          status: v.status,
          chiefComplaint: v.chiefComplaint,
          diagnoses: dxByVisit.get(v.id) ?? [],
          doctorName: v.doctorName ?? null,
        })),
        treatments: treatmentRows.map((r) => ({
          id: r.id,
          createdOn: r.createdAt.slice(0, 10),
          procedureLabel: r.procedureLabel,
          toothFdi: r.toothFdi,
          status: r.status,
          estimateLabel: formatRupees(r.estimatePaise),
        })),
      };
    },
  };
}
