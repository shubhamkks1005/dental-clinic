import { isSettingKey, parseSettingValue, type SettingKey } from "@clinic/shared";
import { and, desc, eq, isNull } from "drizzle-orm";
import { auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { auditLog, settings, users } from "../schema";
import { nowUtcSql } from "../sql";

export type SettingHistoryEntry = {
  id: string;
  at: string;
  byUserId: string;
  byName: string;
  beforeValue: unknown;
  afterValue: unknown;
  versionBefore: number;
  versionAfter: number;
};

type Snapshot = { key: string; value: unknown; version: number };

function parseSnapshot(json: string | null): Snapshot | null {
  if (!json) return null;
  try {
    const v = JSON.parse(json) as Snapshot;
    if (typeof v?.key !== "string" || typeof v.version !== "number") return null;
    return v;
  } catch {
    return null;
  }
}

/** 6.5.2: list setting change history; restore creates a new version (never deletes audit). */
export function settingsHistoryRepo(db: Db, ctx: Ctx) {
  return {
    async history(key: string, limit = 30): Promise<SettingHistoryEntry[]> {
      // Q1.11 (D4): the desk does not read billing settings, nor their history.
      assertAllowed(ctx, key.startsWith("billing.") ? "settings.billing" : "settings.read");
      if (!isSettingKey(key)) throw new NotFoundError(`The setting "${key}"`);
      const row = await db
        .select({ id: settings.id })
        .from(settings)
        .where(and(eq(settings.key, key), isNull(settings.deletedAt)))
        .get();
      if (!row) throw new NotFoundError(`The setting "${key}"`);

      const cap = Math.min(Math.max(limit, 1), 50);
      const rows = await db
        .select({
          id: auditLog.id,
          at: auditLog.createdAt,
          byUserId: auditLog.createdBy,
          byName: users.name,
          beforeJson: auditLog.beforeJson,
          afterJson: auditLog.afterJson,
        })
        .from(auditLog)
        .leftJoin(users, eq(users.id, auditLog.createdBy))
        .where(
          and(
            eq(auditLog.tableName, "settings"),
            eq(auditLog.rowId, row.id),
            isNull(auditLog.deletedAt),
          ),
        )
        .orderBy(desc(auditLog.createdAt))
        .limit(cap);

      const out: SettingHistoryEntry[] = [];
      for (const r of rows) {
        const before = parseSnapshot(r.beforeJson);
        const after = parseSnapshot(r.afterJson);
        if (!before || !after || before.key !== key || after.key !== key) continue;
        out.push({
          id: r.id,
          at: r.at,
          byUserId: r.byUserId,
          byName: r.byName?.trim() || "Staff",
          beforeValue: before.value,
          afterValue: after.value,
          versionBefore: before.version,
          versionAfter: after.version,
        });
      }
      return out;
    },

    /** Restore the value from before that change; bumps version + new audit row. */
    async restore(key: string, auditId: string, expectedVersion: number) {
      assertAllowed(ctx, "settings.write");
      if (!isSettingKey(key)) throw new NotFoundError(`The setting "${key}"`);
      const audit = await db
        .select()
        .from(auditLog)
        .where(and(eq(auditLog.id, auditId), isNull(auditLog.deletedAt)))
        .get();
      if (!audit || audit.tableName !== "settings") {
        throw new NotFoundError("That settings change");
      }
      const before = parseSnapshot(audit.beforeJson);
      if (!before || before.key !== key) {
        throw new InvalidError("That change does not belong to this setting.");
      }
      const parsed = parseSettingValue(key as SettingKey, before.value);
      if (!parsed.ok) throw new InvalidError(parsed.message);

      const row = await db
        .select()
        .from(settings)
        .where(and(eq(settings.key, key), isNull(settings.deletedAt)))
        .get();
      if (!row) throw new NotFoundError(`The setting "${key}"`);
      if (row.version !== expectedVersion) throw new ConflictError();
      const version = expectedVersion + 1;
      const currentValue = JSON.parse(row.valueJson) as unknown;

      const [updated] = await db.batch([
        db
          .update(settings)
          .set({
            valueJson: JSON.stringify(parsed.value),
            version,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(and(eq(settings.id, row.id), eq(settings.version, expectedVersion)))
          .returning({ id: settings.id }),
        auditInsertIfChanged(db, ctx, {
          action: "update",
          table: "settings",
          rowId: row.id,
          before: { key, value: currentValue, version: expectedVersion },
          after: { key, value: parsed.value, version },
        }),
      ]);
      if (updated.length === 0) throw new ConflictError();
      return { value: parsed.value, version };
    },
  };
}
