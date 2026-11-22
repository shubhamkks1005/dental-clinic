import { newUlid, type PrescriptionItemInput } from "@clinic/shared";
import { and, eq, isNull } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { prescriptionItems, prescriptions } from "../schema";
import { nowUtcSql } from "../sql";
import { prescriptionsGetRepo, type PrescriptionRow } from "./prescriptions-get";

async function loadDraft(db: Db, id: string, version: number) {
  const row = await db
    .select()
    .from(prescriptions)
    .where(and(eq(prescriptions.id, id), isNull(prescriptions.deletedAt)))
    .get();
  if (!row) throw new NotFoundError("That prescription");
  if (row.status !== "draft") {
    throw new InvalidError("This prescription is locked. Use Revise to make a new version.");
  }
  if (row.version !== version) throw new ConflictError();
  return row;
}

// 4.2.2–4.2.5: edit draft items and meta (advice, follow-up, weight).
export function prescriptionsDraftRepo(db: Db, ctx: Ctx) {
  const getRepo = prescriptionsGetRepo(db, ctx);

  return {
    async replaceItems(
      id: string,
      version: number,
      items: PrescriptionItemInput[],
    ): Promise<PrescriptionRow> {
      assertAllowed(ctx, "prescriptions.write");
      const row = await loadDraft(db, id, version);

      const oldItems = await db
        .select({ id: prescriptionItems.id })
        .from(prescriptionItems)
        .where(and(eq(prescriptionItems.prescriptionId, id), isNull(prescriptionItems.deletedAt)));

      const inserts = items.map((item, i) =>
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

      const bump = db
        .update(prescriptions)
        .set({
          version: row.version + 1,
          updatedAt: nowUtcSql,
          updatedBy: ctx.userId,
        })
        .where(and(eq(prescriptions.id, id), eq(prescriptions.version, version)));
      const audit = auditInsert(db, ctx, {
        action: "update",
        table: "prescriptions",
        rowId: id,
        before: { itemCount: oldItems.length },
        after: { itemCount: items.length },
      });
      const softDeletes = oldItems.map((item) =>
        db
          .update(prescriptionItems)
          .set({
            deletedAt: nowUtcSql,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(eq(prescriptionItems.id, item.id)),
      );
      await db.batch([bump, audit, ...softDeletes, ...inserts]);

      return getRepo.get(id);
    },

    async patchMeta(
      id: string,
      input: {
        version: number;
        weightKg?: number | null;
        advice?: string;
        followUpOn?: string | null;
        dentistDispensed?: boolean;
        dentistDispensedNote?: string;
      },
    ): Promise<PrescriptionRow> {
      assertAllowed(ctx, "prescriptions.write");
      const row = await loadDraft(db, id, input.version);

      const [updated] = await db.batch([
        db
          .update(prescriptions)
          .set({
            weightKg: input.weightKg !== undefined ? input.weightKg : row.weightKg,
            advice: input.advice !== undefined ? input.advice || null : row.advice,
            followUpOn: input.followUpOn !== undefined ? input.followUpOn : row.followUpOn,
            dentistDispensed:
              input.dentistDispensed !== undefined ? input.dentistDispensed : row.dentistDispensed,
            dentistDispensedNote:
              input.dentistDispensedNote !== undefined
                ? input.dentistDispensedNote || null
                : row.dentistDispensedNote,
            version: row.version + 1,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(and(eq(prescriptions.id, id), eq(prescriptions.version, input.version)))
          .returning({ id: prescriptions.id }),
        auditInsert(db, ctx, {
          action: "update",
          table: "prescriptions",
          rowId: id,
          before: { advice: row.advice, followUpOn: row.followUpOn },
          after: {
            advice: input.advice ?? row.advice,
            followUpOn: input.followUpOn ?? row.followUpOn,
          },
        }),
      ]);
      if (updated.length === 0) throw new ConflictError();
      return getRepo.get(id);
    },
  };
}
