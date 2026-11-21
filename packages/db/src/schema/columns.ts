import { sql } from "drizzle-orm";
import { integer, text } from "drizzle-orm/sqlite-core";

export const STANDARD_COLUMNS = [
  "id",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "deleted_at",
  "version",
] as const;

// UTC ISO text with milliseconds, e.g. 2026-11-22T05:30:00.000Z.
const nowUtc = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

// New builders on every call: Drizzle column builders must not be shared between tables.
// created_by / updated_by hold a users.id, or 'system' for seeds and jobs.
export function standardColumns() {
  return {
    id: text("id").primaryKey(),
    createdAt: text("created_at").notNull().default(nowUtc),
    updatedAt: text("updated_at").notNull().default(nowUtc),
    createdBy: text("created_by").notNull(),
    updatedBy: text("updated_by").notNull(),
    deletedAt: text("deleted_at"),
    version: integer("version").notNull().default(1),
  };
}

// Enums are TEXT + CHECK. Values are code constants, never user input.
export function oneOf(column: string, values: readonly string[]) {
  if (values.some((v) => !/^[a-z0-9_./-]+$/.test(v))) {
    throw new Error(`Enum values for ${column} must be plain lowercase words`);
  }
  return sql.raw(`"${column}" IN (${values.map((v) => `'${v}'`).join(", ")})`);
}
