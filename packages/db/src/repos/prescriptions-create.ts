import { newUlid, type CreatePrescriptionInput } from "@clinic/shared";
import { and, eq, isNull } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { patients, prescriptionItems, prescriptions, visits } from "../schema";
import { prescriptionsGetRepo, type PrescriptionRow } from "./prescriptions-get";

export type { PrescriptionItemRow, PrescriptionRow } from "./prescriptions-get";

// 4.2.1: create a draft prescription with snapshotted medicine lines.
export function prescriptionsCreateRepo(db: Db, ctx: Ctx) {
  const getRepo = prescriptionsGetRepo(db, ctx);

  return {
    async create(input: CreatePrescriptionInput): Promise<PrescriptionRow> {
      assertAllowed(ctx, "prescriptions.write");

      const patient = await db
        .select({ id: patients.id })
        .from(patients)
        .where(and(eq(patients.id, input.patientId), isNull(patients.deletedAt)))
        .get();
      if (!patient) throw new NotFoundError("That patient");

      if (input.visitId) {
        const visit = await db
          .select({ id: visits.id, patientId: visits.patientId })
          .from(visits)
          .where(and(eq(visits.id, input.visitId), isNull(visits.deletedAt)))
          .get();
        if (!visit) throw new NotFoundError("That visit");
        if (visit.patientId !== input.patientId) {
          throw new NotFoundError("That visit");
        }
      }

      const id = newUlid();
      const itemInserts = input.items.map((item, i) =>
        db.insert(prescriptionItems).values({
          id: newUlid(),
          prescriptionId: id,
          medicineId: item.medicineId ?? null,
          genericName: item.genericName,
          brand: item.brand,
          form: item.form,
          strength: item.strength,
          dose: item.dose,
          frequency: item.frequency,
          days: item.days,
          timing: item.timing,
          instruction: item.instruction,
          tags: item.tags,
          sortOrder: i + 1,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
      );

      await db.batch([
        db.insert(prescriptions).values({
          id,
          patientId: input.patientId,
          visitId: input.visitId ?? null,
          doctorId: ctx.userId,
          weightKg: input.weightKg ?? null,
          advice: input.advice || null,
          followUpOn: input.followUpOn ?? null,
          status: "draft",
          dentistDispensed: input.dentistDispensed,
          dentistDispensedNote: input.dentistDispensedNote || null,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
        ...itemInserts,
        auditInsert(db, ctx, {
          action: "create",
          table: "prescriptions",
          rowId: id,
          before: null,
          after: {
            patientId: input.patientId,
            visitId: input.visitId ?? null,
            itemCount: input.items.length,
            status: "draft",
          },
        }),
      ]);

      return getRepo.get(id);
    },
  };
}
