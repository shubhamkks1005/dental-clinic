import { sql } from "drizzle-orm";

// The current time as UTC ISO text with milliseconds, e.g. 2026-11-22T05:30:00.000Z.
// Used for column defaults and for updated_at in writes, so every timestamp has one format.
export const nowUtcSql = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;
