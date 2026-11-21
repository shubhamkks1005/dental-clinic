import { newUlid, type AccessAction, type AuditAction } from "@clinic/shared";
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

// Put this in the SAME db.batch() as the change it describes, so both are saved or neither is.
// audit_log is append-only: nothing in app code may update or delete it (append-only.test.ts).
export function auditInsert(db: Db, ctx: Ctx, entry: AuditEntry) {
  return db.insert(auditLog).values({
    id: newUlid(),
    action: entry.action,
    tableName: entry.table,
    rowId: entry.rowId,
    beforeJson: entry.before === undefined ? null : JSON.stringify(entry.before),
    afterJson: entry.after === undefined ? null : JSON.stringify(entry.after),
    requestId: ctx.requestId,
    createdBy: ctx.userId,
    updatedBy: ctx.userId,
  });
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
