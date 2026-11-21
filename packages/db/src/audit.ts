import { newUlid, type AccessAction, type AuditAction } from "@clinic/shared";
import { getTableColumns, is, SQL, sql } from "drizzle-orm";
import type { Db } from "./client";
import type { Ctx } from "./context";
import { accessLog, auditLog } from "./schema";

export type AuditEntry = {
  action: AuditAction;
  table: string;
  rowId: string;
  before?: unknown;
  after?: unknown;
};

function auditValues(ctx: Ctx, entry: AuditEntry) {
  return {
    id: newUlid(),
    action: entry.action,
    tableName: entry.table,
    rowId: entry.rowId,
    beforeJson: entry.before === undefined ? null : JSON.stringify(entry.before),
    afterJson: entry.after === undefined ? null : JSON.stringify(entry.after),
    requestId: ctx.requestId,
    createdBy: ctx.userId,
    updatedBy: ctx.userId,
  } satisfies typeof auditLog.$inferInsert;
}

// Put this in the SAME db.batch() as the change it describes, so both are saved or neither is.
// audit_log is append-only: nothing in app code may update or delete it (append-only.test.ts).
export function auditInsert(db: Db, ctx: Ctx, entry: AuditEntry) {
  return db.insert(auditLog).values(auditValues(ctx, entry));
}

// For version-checked updates (1.2.7): place right after the UPDATE in the batch. It writes the
// audit row only if that UPDATE changed a row (SQLite changes()), so a lost race leaves no audit row.
export function auditInsertIfChanged(db: Db, ctx: Ctx, entry: AuditEntry) {
  const values: Record<string, unknown> = auditValues(ctx, entry);
  // insert().select(sql) fills every column in table order, so give each one a value or its default.
  const cells = Object.entries(getTableColumns(auditLog)).map(([key, column]) => {
    if (key in values) return sql`${values[key]}`;
    if (is(column.default, SQL)) return column.default;
    return column.default === undefined ? sql`NULL` : sql`${column.default}`;
  });
  return db.insert(auditLog).select(sql`SELECT ${sql.join(cells, sql`, `)} WHERE changes() > 0`);
}

export type AccessEntry = { action: AccessAction; resource: string; resourceId?: string };

// Logins and every view or export of patient data. Also append-only.
export function accessInsert(db: Db, ctx: Ctx, entry: AccessEntry) {
  return db.insert(accessLog).values({
    id: newUlid(),
    action: entry.action,
    resource: entry.resource,
    resourceId: entry.resourceId ?? null,
    requestId: ctx.requestId,
    createdBy: ctx.userId,
    updatedBy: ctx.userId,
  });
}
