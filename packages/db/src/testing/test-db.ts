import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { createDb, type D1Binding, type Db } from "../client";
import { FakeD1 } from "./fake-d1";
import { DB_MIGRATIONS as MIGRATIONS } from "./paths";

// A fresh in-memory SQLite with every migration applied, exactly as wrangler applies them.
export function migratedSqlite(): DatabaseSync {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  const files = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) sqlite.exec(readFileSync(`${MIGRATIONS}${file}`, "utf8"));
  return sqlite;
}

// The real drizzle D1 client over a migrated in-memory database.
export function testDb(): { db: Db; sqlite: DatabaseSync } {
  const sqlite = migratedSqlite();
  return { db: createDb(new FakeD1(sqlite) as unknown as D1Binding), sqlite };
}
