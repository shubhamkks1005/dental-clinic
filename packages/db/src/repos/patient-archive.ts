import { and, eq, isNull } from "drizzle-orm";
import { auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { patients } from "../schema";
import { nowUtcSql } from "../sql";

type Row = typeof patients.$inferSelect;

// 2.1.8 / 3.5.15: archive hides from default search only; History (and get-by-id) stay viewable.
// Restore brings back. Soft delete stays separate.
export function patientArchiveRepo(db: Db, ctx: Ctx) {
  return {
    async archive(id: string, reason: string, version: number): Promise<void> {
      assertAllowed(ctx, "patients.edit");
      const why = reason.trim();
      if (why.length < 2) throw new InvalidError("Add a short reason for archiving this patient.");
      const row = await load(id, version);
      if (row.status === "archived") {
        throw new InvalidError("This patient is already archived.");
      }
      await applyStatus(row, "archived", {
        action: "update",
        after: { status: "archived", reason: why },
      });
    },

    async restore(id: string, version: number): Promise<void> {
      assertAllowed(ctx, "patients.edit");
      const row = await load(id, version);
      if (row.status !== "archived") {
        throw new InvalidError("This patient is not archived.");
      }
      await applyStatus(row, "active", {
        action: "restore",
        after: { status: "active" },
      });
    },
  };

  async function load(id: string, version: number): Promise<Row> {
    const row = await db
      .select()
      .from(patients)
      .where(and(eq(patients.id, id), isNull(patients.deletedAt)))
      .get();
    if (!row) throw new NotFoundError("This patient");
    if (row.version !== version) throw new ConflictError();
    return row;
  }

  async function applyStatus(
    row: Row,
    status: "active" | "archived",
    audit: { action: "update" | "restore"; after: object },
  ) {
    await db.batch([
      db
        .update(patients)
        .set({
          status,
          version: row.version + 1,
          updatedAt: nowUtcSql,
          updatedBy: ctx.userId,
        })
        .where(and(eq(patients.id, row.id), eq(patients.version, row.version))),
      auditInsertIfChanged(db, ctx, {
        action: audit.action,
        table: "patients",
        rowId: row.id,
        before: { status: row.status },
        after: audit.after,
      }),
    ]);
  }
}
