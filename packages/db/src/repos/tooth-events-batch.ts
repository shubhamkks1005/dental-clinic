import { isFdiTooth, isToothSurface, newUlid, type ToothSurface } from "@clinic/shared";
import { and, eq, isNull } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { patients, toothEvents, visits } from "../schema";

export const TOOTH_EVENT_BATCH_MAX = 40;

export type ToothEventLine = { toothFdi: number; surface: string; conditionCode: string };

// B9: the chart autosaves marks in small groups and the Save button sends whatever is waiting.
// One request, one db.batch, all marks or none. The marks keep their order (1 ms apart), so the
// latest one for a tooth and surface wins exactly as if they had been sent one by one.
export function toothEventsBatchRepo(db: Db, ctx: Ctx) {
  return {
    async addMany(
      patientId: string,
      visitId: string,
      lines: ToothEventLine[],
    ): Promise<{ ids: string[] }> {
      assertAllowed(ctx, "clinical.edit");
      if (lines.length === 0) return { ids: [] };
      if (lines.length > TOOTH_EVENT_BATCH_MAX) {
        throw new InvalidError(`Save at most ${TOOTH_EVENT_BATCH_MAX} chart marks at a time.`);
      }
      for (const line of lines) {
        if (!isFdiTooth(line.toothFdi)) {
          throw new InvalidError("Use an FDI tooth number (11–48 or 51–85).");
        }
        if (!isToothSurface(line.surface)) {
          throw new InvalidError("Use a surface: m, d, o, b, l, or whole.");
        }
        const code = line.conditionCode.trim();
        if (!code || code.length > 40) {
          throw new InvalidError("Enter a condition code (up to 40 characters).");
        }
      }

      const [patient, visit] = await db.batch([
        db
          .select({ id: patients.id })
          .from(patients)
          .where(and(eq(patients.id, patientId), isNull(patients.deletedAt))),
        db
          .select({ patientId: visits.patientId, status: visits.status })
          .from(visits)
          .where(and(eq(visits.id, visitId), isNull(visits.deletedAt))),
      ]);
      if (!patient[0]) throw new NotFoundError("That patient");
      const v = visit[0];
      if (!v) throw new NotFoundError("That visit");
      if (v.patientId !== patientId) {
        throw new InvalidError("That visit belongs to a different patient.");
      }
      if (v.status !== "draft") throw new InvalidError("Chart changes go on a draft visit only.");

      const base = Date.now();
      const ids = lines.map(() => newUlid());
      const statements = lines.flatMap((line, i) => {
        const code = line.conditionCode.trim();
        const id = ids[i] as string;
        return [
          db.insert(toothEvents).values({
            id,
            patientId,
            toothFdi: line.toothFdi,
            surface: line.surface as ToothSurface,
            conditionCode: code,
            visitId,
            notedAt: new Date(base + i).toISOString(),
            notedBy: ctx.userId,
            createdBy: ctx.userId,
            updatedBy: ctx.userId,
          }),
          auditInsert(db, ctx, {
            action: "create" as const,
            table: "tooth_events",
            rowId: id,
            after: {
              patientId,
              toothFdi: line.toothFdi,
              surface: line.surface,
              conditionCode: code,
              visitId,
            },
          }),
        ];
      });
      await db.batch(statements as [(typeof statements)[number], ...(typeof statements)[number][]]);
      return { ids };
    },
  };
}
