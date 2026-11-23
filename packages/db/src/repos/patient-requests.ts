import { defaultRequestDueOn, newUlid } from "@clinic/shared";
import { and, asc, eq, isNull } from "drizzle-orm";
import { auditInsert, auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { patientRequests } from "../schema/patient-requests";
import { nowUtcSql } from "../sql";

export function patientRequestsRepo(db: Db, ctx: Ctx) {
  return {
    async listOpen() {
      assertAllowed(ctx, "patients.view");
      return db
        .select()
        .from(patientRequests)
        .where(and(eq(patientRequests.status, "open"), isNull(patientRequests.deletedAt)))
        .orderBy(asc(patientRequests.dueOn))
        .all();
    },

    async create(input: { patientId: string; type: string; body: string }) {
      assertAllowed(ctx, "patients.edit");
      const id = newUlid();
      const dueOn = defaultRequestDueOn();
      await db.batch([
        db.insert(patientRequests).values({
          id,
          createdBy: ctx.userId,
          updatedBy: ctx.userId,
          patientId: input.patientId,
          type: input.type,
          body: input.body,
          status: "open",
          dueOn,
        }),
        auditInsert(db, ctx, {
          action: "create",
          table: "patient_requests",
          rowId: id,
          before: null,
          after: { type: input.type, dueOn, patientId: input.patientId },
        }),
      ]);
      return { id, dueOn };
    },

    async close(id: string, input: { status: "done" | "rejected"; note: string; version: number }) {
      assertAllowed(ctx, "patients.edit");
      const note = input.note.trim();
      if (!note) throw new InvalidError("Enter a closing note.");
      const row = await db
        .select()
        .from(patientRequests)
        .where(and(eq(patientRequests.id, id), isNull(patientRequests.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("That request was not found.");
      if (row.version !== input.version) throw new ConflictError();
      if (row.status !== "open") throw new InvalidError("That request is already closed.");
      const now = new Date().toISOString();
      await db.batch([
        db
          .update(patientRequests)
          .set({
            status: input.status,
            closedNote: note.slice(0, 500),
            closedAt: now,
            closedBy: ctx.userId,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
            version: row.version + 1,
          })
          .where(and(eq(patientRequests.id, id), eq(patientRequests.version, row.version))),
        auditInsertIfChanged(db, ctx, {
          action: "update",
          table: "patient_requests",
          rowId: id,
          before: { status: row.status },
          after: { status: input.status },
        }),
      ]);
      return { id, status: input.status };
    },
  };
}
