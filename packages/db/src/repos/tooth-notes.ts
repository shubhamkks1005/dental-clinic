import { isFdiTooth, newUlid } from "@clinic/shared";
import { and, eq, isNull } from "drizzle-orm";
import { auditInsert, auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { patients, toothNotes, visits } from "../schema";
import { nowUtcSql } from "../sql";

export type ToothNote = {
  id: string;
  patientId: string;
  toothFdi: number;
  body: string;
  version: number;
  updatedAt: string;
};

export const TOOTH_NOTE_MAX = 1000;

const noteCols = {
  id: toothNotes.id,
  patientId: toothNotes.patientId,
  toothFdi: toothNotes.toothFdi,
  body: toothNotes.body,
  version: toothNotes.version,
  updatedAt: toothNotes.updatedAt,
};

// B7: the doctor's short note on one tooth. Only while a draft visit of this patient is open
// (the same lock as every other edit); doctor only (clinical.edit / clinical.view).
export function toothNotesRepo(db: Db, ctx: Ctx) {
  const live = (patientId: string, fdi: number) =>
    and(
      eq(toothNotes.patientId, patientId),
      eq(toothNotes.toothFdi, fdi),
      isNull(toothNotes.deletedAt),
    );

  async function get(patientId: string, toothFdi: number): Promise<ToothNote | null> {
    assertAllowed(ctx, "clinical.view");
    if (!isFdiTooth(toothFdi)) throw new InvalidError("Tooth number must be a valid FDI number.");
    return (
      (await db.select(noteCols).from(toothNotes).where(live(patientId, toothFdi)).get()) ?? null
    );
  }

  return {
    get,

    /**
     * Save, change or clear (empty text) the note. `version` is the one the doctor last saw; leave it
     * out when there is no note yet. Returns the saved note, or null when it was cleared.
     */
    async save(
      patientId: string,
      toothFdi: number,
      input: { visitId: string; body: string; version?: number | null },
    ): Promise<ToothNote | null> {
      assertAllowed(ctx, "clinical.edit");
      if (!isFdiTooth(toothFdi)) throw new InvalidError("Tooth number must be a valid FDI number.");
      const body = input.body.trim();
      if (body.length > TOOTH_NOTE_MAX) {
        throw new InvalidError(`The note is too long (at most ${TOOTH_NOTE_MAX} characters).`);
      }

      const [visit, existing] = await db.batch([
        db
          .select({ patientId: visits.patientId, status: visits.status })
          .from(visits)
          .where(and(eq(visits.id, input.visitId), isNull(visits.deletedAt))),
        db.select(noteCols).from(toothNotes).where(live(patientId, toothFdi)),
      ]);
      const v = visit[0];
      if (!v || v.patientId !== patientId) throw new NotFoundError("That visit");
      if (v.status !== "draft") {
        throw new InvalidError("This visit is finalised. Add an addendum instead of editing it.");
      }
      const patient = await db
        .select({ id: patients.id })
        .from(patients)
        .where(and(eq(patients.id, patientId), isNull(patients.deletedAt)))
        .get();
      if (!patient) throw new NotFoundError("That patient");

      const old = existing[0];
      if (!old) {
        if (input.version) throw new ConflictError();
        if (!body) return null;
        const id = newUlid();
        try {
          await db.batch([
            db.insert(toothNotes).values({
              id,
              patientId,
              toothFdi,
              body,
              createdBy: ctx.userId,
              updatedBy: ctx.userId,
            }),
            auditInsert(db, ctx, {
              action: "create",
              table: "tooth_notes",
              rowId: id,
              after: { patientId, toothFdi, body },
            }),
          ]);
        } catch (e) {
          // Two saves at once: the unique index lets only one live note per tooth in.
          if (e instanceof Error && /UNIQUE/i.test(`${e.message} ${String(e.cause ?? "")}`)) {
            throw new ConflictError();
          }
          throw e;
        }
        return get(patientId, toothFdi);
      }

      if (input.version !== old.version) throw new ConflictError();
      const next = old.version + 1;
      await db.batch([
        db
          .update(toothNotes)
          .set({
            body: body || old.body,
            ...(body ? {} : { deletedAt: nowUtcSql }),
            version: next,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(
            and(
              eq(toothNotes.id, old.id),
              eq(toothNotes.version, old.version),
              isNull(toothNotes.deletedAt),
            ),
          ),
        auditInsertIfChanged(db, ctx, {
          action: body ? "update" : "delete",
          table: "tooth_notes",
          rowId: old.id,
          before: { body: old.body },
          ...(body ? { after: { body } } : {}),
        }),
      ]);
      const check = await db
        .select({ version: toothNotes.version })
        .from(toothNotes)
        .where(eq(toothNotes.id, old.id))
        .get();
      if (check?.version !== next) throw new ConflictError();
      return body ? get(patientId, toothFdi) : null;
    },
  };
}
