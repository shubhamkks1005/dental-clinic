import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { afterAll, describe, expect, it } from "vitest";
import { STANDARD_COLUMNS } from "./schema/columns";

// D1 is SQLite, so Node's built-in SQLite is a faithful check of the migration SQL.
// pnpm runs package scripts with packages/db as the working directory.
const DIR = "migrations";

function freshDatabase(): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  const files = readdirSync(DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) db.exec(readFileSync(`${DIR}/${file}`, "utf8"));
  return db;
}

const db = freshDatabase();
afterAll(() => db.close());

const tableNames = () =>
  db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    .all()
    .map((r) => r.name);

const columnNames = (table: string) =>
  db
    .prepare(`PRAGMA table_info(${table})`)
    .all()
    .map((r) => r.name);

const insertUser = (email: string, role: string) =>
  db
    .prepare(
      "INSERT INTO users (id, email, name, role, created_by, updated_by) VALUES (?, ?, 'Test User', ?, 'system', 'system')",
    )
    .run(`id-${email}`, email, role);

describe("migrations on an empty database (1.2.3)", () => {
  it("create exactly the base tables", () => {
    expect(tableNames()).toEqual([
      "access_log",
      "audit_log",
      "counters",
      "files",
      "settings",
      "users",
    ]);
  });

  it("give every table the standard columns", () => {
    for (const table of tableNames()) {
      expect(columnNames(String(table))).toEqual(expect.arrayContaining([...STANDARD_COLUMNS]));
    }
  });

  it("seed the default settings", () => {
    const rows = db.prepare("SELECT key, value_json FROM settings ORDER BY key").all();
    expect(rows).toEqual([
      { key: "patient_code.digits", value_json: "6" },
      { key: "patient_code.prefix", value_json: '"P-"' },
    ]);
  });

  it("fill created_at as UTC ISO text", () => {
    const row = db.prepare("SELECT created_at FROM settings LIMIT 1").get();
    expect(row?.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it("accept a valid staff user and reject a bad role or uppercase email", () => {
    expect(() => insertUser("doctor@example.com", "doctor")).not.toThrow();
    expect(() => insertUser("admin@example.com", "admin")).toThrow(/CHECK/);
    expect(() => insertUser("Upper@example.com", "receptionist")).toThrow(/CHECK/);
  });

  it("reject invalid settings JSON, bad counter periods and negative counters", () => {
    expect(() =>
      db.exec(
        "INSERT INTO settings (id, key, value_json, created_by, updated_by) VALUES ('s1', 'x', 'not json', 'system', 'system')",
      ),
    ).toThrow(/CHECK/);
    const counter = (id: string, period: string, value: number) =>
      db
        .prepare(
          "INSERT INTO counters (id, name, period, value, created_by, updated_by) VALUES (?, 'receipt', ?, ?, 'system', 'system')",
        )
        .run(id, period, value);
    expect(() => counter("c1", "2026-27", 0)).not.toThrow();
    expect(() => counter("c2", "2026", 0)).toThrow(/CHECK/);
    expect(() => counter("c3", "2027-28", -1)).toThrow(/CHECK/);
    expect(() => counter("c4", "2026-27", 5)).toThrow(/UNIQUE/);
  });
});
