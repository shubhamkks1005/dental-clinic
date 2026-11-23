import { defaultRequestDueOn, newUlid } from "@clinic/shared";
import { and, asc, eq, isNull } from "drizzle-orm";
import { accessInsert, auditInsert, auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { patients } from "../schema";
import { patientRequests } from "../schema/patient-requests";
import { nowUtcSql } from "../sql";

export function patientRequestsRepo(db: Db, ctx: Ctx) {
  return {
    /** 8.2.11 staff list (all statuses or one). The note text is hidden from the receptionist. */
    async list(status: "open" | "done" | "rejected" | "all" = "open") {
      assertAllowed(ctx, "requests.view");
      const rows = await db
        .select({
          id: patientRequests.id,
          patientId: patientRequests.patientId,
          patientName: patients.fullName,
          patientCode: patients.code,
          type: patientRequests.type,
          status: patientRequests.status,
          dueOn: patientRequests.dueOn,
          createdAt: patientRequests.createdAt,
          closedAt: patientRequests.closedAt,
          version: patientRequests.version,
        })
        .from(patientRequests)
        .innerJoin(patients, eq(patients.id, patientRequests.patientId))
        .where(
          and(
            isNull(patientRequests.deletedAt),
            status === "all" ? undefined : eq(patientRequests.status, status),
          ),
        )
        .orderBy(asc(patientRequests.dueOn))
        .limit(200)
        .all();
      return rows;
    },

    /** One request with its note text. Doctor only; the view goes to the access log. */
    async get(id: string) {
      assertAllowed(ctx, "requests.manage");
      const row = await db
        .select()
        .from(patientRequests)
        .where(and(eq(patientRequests.id, id), isNull(patientRequests.deletedAt)))
        .get();
      if (!row) throw new NotFoundError("That request");
      await accessInsert(db, ctx, {
        action: "view",
        resource: "patient_request",
        resourceId: id,
        detail: "viewed patient request",
      }).run();
      return row;
    },

    async create(input: { patientId: string; type: string; body: string }) {
      assertAllowed(ctx, "patients.edit");
      const patient = await db
        .select({ id: patients.id })
        .from(patients)
        .where(and(eq(patients.id, input.patientId), isNull(patients.deletedAt)))
        .get();
      if (!patient) throw new NotFoundError("That patient");
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
      assertAllowed(ctx, "requests.manage");
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
