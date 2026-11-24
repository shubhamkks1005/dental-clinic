import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "../client";
import { settings } from "../schema";

/** A whole-number setting (a tunable), or the fallback when it is not stored or not a number. */
export async function intSetting(db: Db, key: string, fallback: number): Promise<number> {
  const row = await db
    .select({ valueJson: settings.valueJson })
    .from(settings)
    .where(and(eq(settings.key, key), isNull(settings.deletedAt)))
    .get();
  if (!row) return fallback;
  const n = JSON.parse(row.valueJson) as unknown;
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}
