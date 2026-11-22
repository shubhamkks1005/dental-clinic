import { isFdiTooth, isToothSurface, newUlid, type ToothSurface } from "@clinic/shared";
import { and, eq, isNull } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { patients, toothEvents, visits } from "../schema";
import { toothEventsChartRepo } from "./tooth-events-chart";

export type AddToothEventInput = {
  patientId: string;
  toothFdi: number;
  surface: string;
  conditionCode: string;
  visitId?: string | null;
  notedAt?: string;
};

// 3.2.2 / 3.4.5: append tooth event; chart reads live or as-of a finalised visit.
export function toothEventsRepo(db: Db, ctx: Ctx) {
  const chart = toothEventsChartRepo(db, ctx);
  return {
    ...chart,

    async add(input: AddToothEventInput): Promise<{ id: string }> {
      assertAllowed(ctx, "clinical.edit");
      if (!isFdiTooth(input.toothFdi)) {
        throw new InvalidError("Use an FDI tooth number (11–48 or 51–85).");
      }
      if (!isToothSurface(input.surface)) {
        throw new InvalidError("Use a surface: m, d, o, b, l, or whole.");
      }
      const code = input.conditionCode.trim();
      if (!code || code.length > 40) {
        throw new InvalidError("Enter a condition code (up to 40 characters).");
      }

      const patient = await db
        .select({ id: patients.id })
        .from(patients)
        .where(and(eq(patients.id, input.patientId), isNull(patients.deletedAt)))
        .get();
      if (!patient) throw new NotFoundError("That patient");

      if (input.visitId) {
        const visit = await db
          .select({ id: visits.id, patientId: visits.patientId, status: visits.status })
          .from(visits)
          .where(and(eq(visits.id, input.visitId), isNull(visits.deletedAt)))
          .get();
        if (!visit) throw new NotFoundError("That visit");
        if (visit.patientId !== input.patientId) {
          throw new InvalidError("That visit belongs to a different patient.");
        }
        if (visit.status !== "draft") {
          throw new InvalidError("Chart changes go on a draft visit only.");
        }
      }

      const id = newUlid();
      const notedAt = input.notedAt ?? new Date().toISOString();
      await db.batch([
        db.insert(toothEvents).values({
          id,
          patientId: input.patientId,
          toothFdi: input.toothFdi,
          surface: input.surface as ToothSurface,
          conditionCode: code,
          visitId: input.visitId ?? null,
          notedAt,
          notedBy: ctx.userId,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
        }),
        auditInsert(db, ctx, {
          action: "create",
          table: "tooth_events",
          rowId: id,
          after: {
            patientId: input.patientId,
            toothFdi: input.toothFdi,
            surface: input.surface,
            conditionCode: code,
            visitId: input.visitId ?? null,
          },
        }),
      ]);
      return { id };
    },
  };
}
