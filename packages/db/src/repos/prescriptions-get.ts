import { and, asc, eq, isNull } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ForbiddenError, NotFoundError } from "../errors";
import { assertAllowed, isAllowed } from "../permissions";
import { prescriptionItems, prescriptions } from "../schema";

export type PrescriptionItemRow = {
  id: string;
  medicineId: string | null;
  genericName: string;
  brand: string;
  form: string;
  strength: string;
  dose: string;
  frequency: string;
  days: string;
  timing: string;
  instruction: string;
  tags: string;
  sortOrder: number;
};

export type PrescriptionRow = {
  id: string;
  patientId: string;
  visitId: string | null;
  doctorId: string;
  weightKg: number | null;
  advice: string | null;
  followUpOn: string | null;
  status: "draft" | "issued" | "revised";
  rxNo: string | null;
  version: number;
  items: PrescriptionItemRow[];
};

function toItem(r: typeof prescriptionItems.$inferSelect): PrescriptionItemRow {
  return {
    id: r.id,
    medicineId: r.medicineId,
    genericName: r.genericName,
    brand: r.brand,
    form: r.form,
    strength: r.strength,
    dose: r.dose,
    frequency: r.frequency,
    days: r.days,
    timing: r.timing,
    instruction: r.instruction,
    tags: r.tags,
    sortOrder: r.sortOrder,
  };
}

// 4.2.1 get. Doctor: full. Receptionist: issued/revised only (print path); never drafts.
export function prescriptionsGetRepo(db: Db, ctx: Ctx) {
  return {
    async get(id: string): Promise<PrescriptionRow> {
      const canWrite = isAllowed(ctx.role, "prescriptions.write");
      const canPrint = isAllowed(ctx.role, "prescriptions.print");
      if (!canWrite && !canPrint) throw new ForbiddenError();

      const row = await db
        .select()
        .from(prescriptions)
        .where(and(eq(prescriptions.id, id), isNull(prescriptions.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("That prescription");

      if (!canWrite) {
        assertAllowed(ctx, "prescriptions.print");
        if (row.status === "draft") throw new ForbiddenError();
      } else {
        assertAllowed(ctx, "prescriptions.write");
      }

      const items = await db
        .select()
        .from(prescriptionItems)
        .where(and(eq(prescriptionItems.prescriptionId, id), isNull(prescriptionItems.deletedAt)))
        .orderBy(asc(prescriptionItems.sortOrder));

      return {
        id: row.id,
        patientId: row.patientId,
        visitId: row.visitId,
        doctorId: row.doctorId,
        weightKg: row.weightKg,
        advice: row.advice,
        followUpOn: row.followUpOn,
        status: row.status,
        rxNo: row.rxNo,
        version: row.version,
        items: items.map(toItem),
      };
    },
  };
}
