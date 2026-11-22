import { newUlid } from "@clinic/shared";
import { and, asc, eq, isNull } from "drizzle-orm";
import { auditInsert, auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { snapshotJsonAndHash } from "../domain/visit-snapshot";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { toothEvents, visitAddenda, visitDiagnoses, visitProcedures, visits } from "../schema";
import { nowUtcSql } from "../sql";
// Draft field patches live in visits-patch.ts (3.5.3).

export type FinaliseInput = { version: number };

export type AddendumInput = {
  body: string;
  reason: string;
  kind?: "note" | "entered_in_error";
};

// 3.2.6: finalise locks the visit; further field updates are refused. Addenda only.
export function visitsFinaliseRepo(db: Db, ctx: Ctx) {
  return {
    async finalise(visitId: string, input: FinaliseInput) {
      assertAllowed(ctx, "clinical.edit");
      const visit = await loadVisit(db, visitId);
      if (visit.status !== "draft") {
        throw new InvalidError("Only a draft visit can be finalised.");
      }
      if (visit.version !== input.version) throw new ConflictError();

      const diagnoses = await db
        .select()
        .from(visitDiagnoses)
        .where(and(eq(visitDiagnoses.visitId, visitId), isNull(visitDiagnoses.deletedAt)));
      const procedures = await db
        .select()
        .from(visitProcedures)
        .where(and(eq(visitProcedures.visitId, visitId), isNull(visitProcedures.deletedAt)));
      const events = await db
        .select()
        .from(toothEvents)
        .where(and(eq(toothEvents.visitId, visitId), isNull(toothEvents.deletedAt)));

      const finalisedAt = new Date().toISOString();
      const { json, hash } = await snapshotJsonAndHash({
        visit: { ...visit },
        diagnoses,
        procedures,
        toothEvents: events,
        finalisedAt,
        finalisedBy: ctx.userId,
      });

      await db.batch([
        db
          .update(visits)
          .set({
            status: "final",
            finalisedAt,
            finalisedBy: ctx.userId,
            snapshotJson: json,
            snapshotHash: hash,
            version: visit.version + 1,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(
            and(
              eq(visits.id, visitId),
              eq(visits.version, input.version),
              eq(visits.status, "draft"),
            ),
          ),
        auditInsertIfChanged(db, ctx, {
          action: "update",
          table: "visits",
          rowId: visitId,
          before: { status: "draft", version: visit.version },
          after: { status: "final", version: visit.version + 1, snapshotHash: hash },
        }),
      ]);

      const row = await db
        .select({
          id: visits.id,
          status: visits.status,
          snapshotHash: visits.snapshotHash,
          version: visits.version,
        })
        .from(visits)
        .where(eq(visits.id, visitId))
        .get();
      if (!row || row.status !== "final") {
        throw new ConflictError("Could not finalise the visit. Reload and try again.");
      }
      return row;
    },

    async assertDraftWritable(visitId: string): Promise<void> {
      const visit = await loadVisit(db, visitId);
      if (visit.status !== "draft") {
        throw new InvalidError("This visit is finalised. Add an addendum instead of editing it.");
      }
    },

    async listAddenda(visitId: string) {
      assertAllowed(ctx, "clinical.view");
      const rows = await db
        .select({
          id: visitAddenda.id,
          visitId: visitAddenda.visitId,
          kind: visitAddenda.kind,
          body: visitAddenda.body,
          reason: visitAddenda.reason,
          recordedAt: visitAddenda.recordedAt,
          recordedBy: visitAddenda.recordedBy,
        })
        .from(visitAddenda)
        .where(and(eq(visitAddenda.visitId, visitId), isNull(visitAddenda.deletedAt)))
        .orderBy(asc(visitAddenda.recordedAt));
      return rows;
    },

    async addAddendum(visitId: string, input: AddendumInput) {
      assertAllowed(ctx, "clinical.edit");
      const visit = await loadVisit(db, visitId);
      if (visit.status !== "final" && visit.status !== "void") {
        throw new InvalidError("Addenda are only for finalised visits.");
      }
      const body = input.body.trim();
      const reason = input.reason.trim();
      if (!body) throw new InvalidError("Enter the addendum text.");
      if (!reason) throw new InvalidError("Enter a reason for the addendum.");

      const id = newUlid();
      const recordedAt = new Date().toISOString();
      const kind = input.kind ?? "note";
      // 3.5.7: entered-in-error marks the visit void (strikethrough); never hard-delete.
      const markVoid = kind === "entered_in_error" && visit.status === "final";
      if (markVoid) {
        await db.batch([
          db.insert(visitAddenda).values({
            id,
            visitId,
            kind,
            body,
            reason,
            recordedAt,
            recordedBy: ctx.userId,
            createdBy: ctx.userId,
            updatedBy: ctx.userId,
          }),
          db
            .update(visits)
            .set({
              status: "void",
              version: visit.version + 1,
              updatedAt: nowUtcSql,
              updatedBy: ctx.userId,
            })
            .where(and(eq(visits.id, visitId), eq(visits.status, "final"))),
          auditInsert(db, ctx, {
            action: "create",
            table: "visit_addenda",
            rowId: id,
            after: { visitId, kind, reason },
          }),
          auditInsertIfChanged(db, ctx, {
            action: "update",
            table: "visits",
            rowId: visitId,
            before: { status: "final", version: visit.version },
            after: { status: "void", version: visit.version + 1, reason },
          }),
        ]);
      } else {
        await db.batch([
          db.insert(visitAddenda).values({
            id,
            visitId,
            kind,
            body,
            reason,
            recordedAt,
            recordedBy: ctx.userId,
            createdBy: ctx.userId,
            updatedBy: ctx.userId,
          }),
          auditInsert(db, ctx, {
            action: "create",
            table: "visit_addenda",
            rowId: id,
            after: { visitId, kind, reason },
          }),
        ]);
      }
      return { id, visitId, kind, body, reason, recordedAt, recordedBy: ctx.userId };
    },
  };
}

async function loadVisit(db: Db, visitId: string) {
  const visit = await db
    .select()
    .from(visits)
    .where(and(eq(visits.id, visitId), isNull(visits.deletedAt)))
    .get();
  if (!visit) throw new NotFoundError("That visit");
  return visit;
}
