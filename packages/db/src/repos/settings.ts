import { isSettingKey, parseSettingValue, SETTING_KEYS, type SettingKey } from "@clinic/shared";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, InvalidError, NotFoundError } from "../errors";
import { assertAllowed, isAllowed } from "../permissions";
import { settings } from "../schema";
import { nowUtcSql } from "../sql";

export type SettingValue = { value: unknown; version: number };
export type SettingRow = SettingValue & { key: SettingKey };

// Settings store (1.2.6, 1.2.7, 1.5.1): only known keys, every value checked against its rule in
// packages/shared/src/settings.ts, version-checked, and every change audited (before/after).
export function settingsRepo(db: Db, ctx: Ctx) {
  return {
    async list(): Promise<SettingRow[]> {
      assertAllowed(ctx, "settings.read");
      const rows = await db
        .select({ key: settings.key, valueJson: settings.valueJson, version: settings.version })
        .from(settings)
        .where(and(inArray(settings.key, SETTING_KEYS), isNull(settings.deletedAt)));
      // Q1.11 (D4): billing settings are not part of what the desk reads.
      const seeBilling = isAllowed(ctx.role, "settings.billing");
      return rows
        .filter((row): row is typeof row & { key: SettingKey } => isSettingKey(row.key))
        .filter((row) => seeBilling || !row.key.startsWith("billing."))
        .map((row) => ({ key: row.key, value: JSON.parse(row.valueJson), version: row.version }))
        .sort((a, b) => SETTING_KEYS.indexOf(a.key) - SETTING_KEYS.indexOf(b.key));
    },

    async get(key: string): Promise<SettingValue> {
      assertAllowed(ctx, key.startsWith("billing.") ? "settings.billing" : "settings.read");
      const row = await findByKey(db, key);
      return { value: JSON.parse(row.valueJson), version: row.version };
    },

    /** Several settings in ONE read (speed rule 1). Every key must exist, like get(). */
    async getMany(keys: readonly string[]): Promise<Map<string, SettingValue>> {
      for (const key of keys) {
        assertAllowed(ctx, key.startsWith("billing.") ? "settings.billing" : "settings.read");
      }
      const known = keys.filter(isSettingKey);
      const rows = known.length
        ? await db
            .select({ key: settings.key, valueJson: settings.valueJson, version: settings.version })
            .from(settings)
            .where(and(inArray(settings.key, known), isNull(settings.deletedAt)))
        : [];
      const out = new Map<string, SettingValue>();
      for (const row of rows) {
        out.set(row.key, { value: JSON.parse(row.valueJson), version: row.version });
      }
      for (const key of keys) if (!out.has(key)) throw new NotFoundError(`The setting "${key}"`);
      return out;
    },

    // expectedVersion is the version the user saw. If someone saved since, nothing changes
    // and ConflictError (409) tells the user to reload (1.2.7). A value outside its rule is
    // refused before anything is written (1.5.1).
    async update(key: string, value: unknown, expectedVersion: number): Promise<SettingValue> {
      assertAllowed(ctx, "settings.write");
      if (!isSettingKey(key)) throw new NotFoundError(`The setting "${key}"`);
      const parsed = parseSettingValue(key, value);
      if (!parsed.ok) throw new InvalidError(parsed.message);
      const row = await findByKey(db, key);
      if (row.version !== expectedVersion) throw new ConflictError();
      const version = expectedVersion + 1;

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
          before: { key, value: JSON.parse(row.valueJson), version: expectedVersion },
          after: { key, value: parsed.value, version },
        }),
      ]);
      if (updated.length === 0) throw new ConflictError();
      return { value: parsed.value, version };
    },
  };
}

async function findByKey(db: Db, key: string) {
  const row = isSettingKey(key)
    ? await db
        .select()
        .from(settings)
        .where(and(eq(settings.key, key), isNull(settings.deletedAt)))
        .get()
    : undefined;
  if (!row) throw new NotFoundError(`The setting "${key}"`);
  return row;
}
