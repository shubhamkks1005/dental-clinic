import { and, eq, isNull, sql } from "drizzle-orm";
import { auditInsert } from "../audit";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { NotFoundError } from "../errors";
import { assertAllowed } from "../permissions";
import { settings } from "../schema";
import { nowUtcSql } from "../sql";

// Value validation (Zod) comes with 1.5.1; edit-conflict checks with 1.2.7.
export function settingsRepo(db: Db, ctx: Ctx) {
  return {
    async get(key: string): Promise<unknown> {
      assertAllowed(ctx, "settings.read");
      const row = await findByKey(db, key);
      return JSON.parse(row.valueJson);
    },

    async update(key: string, value: unknown): Promise<void> {
      assertAllowed(ctx, "settings.write");
      const row = await findByKey(db, key);
      await db.batch([
        db
          .update(settings)
          .set({
            valueJson: JSON.stringify(value),
            version: sql`${settings.version} + 1`,
            updatedAt: nowUtcSql,
            updatedBy: ctx.userId,
          })
          .where(eq(settings.id, row.id)),
        auditInsert(db, ctx, {
          action: "update",
          table: "settings",
          rowId: row.id,
          before: { key, value: JSON.parse(row.valueJson), version: row.version },
          after: { key, value, version: row.version + 1 },
        }),
      ]);
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
