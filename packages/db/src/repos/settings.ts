import { and, eq, isNull } from "drizzle-orm";
import { auditInsertIfChanged } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError, NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { settings } from "../schema";
import { nowUtcSql } from "../sql";

export type SettingValue = { value: unknown; version: number };

// Value validation (Zod) comes with 1.5.1.
export function settingsRepo(db: Db, ctx: Ctx) {
  return {
    async get(key: string): Promise<SettingValue> {
      assertAllowed(ctx, "settings.read");
      const row = await findByKey(db, key);
      return { value: JSON.parse(row.valueJson), version: row.version };
    },

    // expectedVersion is the version the user saw. If someone saved since, nothing changes
    // and ConflictError (409) tells the user to reload (1.2.7).
    async update(key: string, value: unknown, expectedVersion: number): Promise<SettingValue> {
      assertAllowed(ctx, "settings.write");
      const row = await findByKey(db, key);
      if (row.version !== expectedVersion) throw new ConflictError();
      const version = expectedVersion + 1;

      const [updated] = await db.batch([
        db
          .update(settings)
          .set({
            valueJson: JSON.stringify(value),
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
          after: { key, value, version },
        }),
      ]);
      if (updated.length === 0) throw new ConflictError();
      return { value, version };
    },
  };
}

async function findByKey(db: Db, key: string) {
  const row = await db
    .select()
    .from(settings)
    .where(and(eq(settings.key, key), isNull(settings.deletedAt)))
    .get();
  if (!row) throw new NotFoundError(`The setting "${key}"`);
  return row;
}
