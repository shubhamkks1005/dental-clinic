import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { afterAll, describe, expect, it } from "vitest";
import { DB_MIGRATIONS } from "./testing/paths";

// Library migration 0065: twins allowed, seeded medicines reviewed (Q5/Q9), doctor rows untouched.
const sqlite = new DatabaseSync(":memory:");
afterAll(() => sqlite.close());

const files = readdirSync(DB_MIGRATIONS)
  .filter((f) => f.endsWith(".sql"))
  .sort();
const run = (f: string) => sqlite.exec(readFileSync(`${DB_MIGRATIONS}${f}`, "utf8"));
for (const f of files.filter((f) => f < "0065")) run(f);

sqlite
  .prepare(
    `INSERT INTO list_items (id, created_by, updated_by, list_key, label, data_json, active, sort_order)
     VALUES ('doc-row-1', 'doc-a', 'doc-a', 'medicines', 'Doctor medicine', ?, 1, 999)`,
  )
  .run(JSON.stringify({ form: "Tab", category: "DRAFT - doctor to confirm" }));
for (const f of files.filter((f) => f >= "0065")) run(f);

const row = (where: string) =>
  sqlite.prepare(`SELECT data_json, version FROM list_items WHERE ${where}`).get() as {
    data_json: string;
    version: number;
  };

describe("migration 0065 (Library duplicates and seed review)", () => {
  it("seeded medicine is reviewed, category blank, version bumped", () => {
    const r = row("id = '01M84MED01AMOX50000000001'");
    const data = JSON.parse(r.data_json);
    expect(data.reviewed).toBe("yes");
    expect(data.category).toBe("");
    expect(data.strength).toBe("500 mg");
    expect(r.version).toBe(2);
  });

  it("a doctor-added row is untouched", () => {
    const r = row("id = 'doc-row-1'");
    expect(JSON.parse(r.data_json)).toEqual({ form: "Tab", category: "DRAFT - doctor to confirm" });
    expect(r.version).toBe(1);
  });

  it("no seeded medicine is left in Needs review", () => {
    const n = sqlite
      .prepare(
        `SELECT count(*) AS n FROM list_items WHERE list_key = 'medicines' AND created_by = 'system'
         AND coalesce(json_extract(data_json, '$.reviewed'), '') <> 'yes'`,
      )
      .get() as { n: number };
    expect(n.n).toBe(0);
  });

  it("the same name can be saved twice in one list", () => {
    const add = (id: string) =>
      sqlite
        .prepare(
          `INSERT INTO list_items (id, created_by, updated_by, list_key, label, data_json, sort_order)
           VALUES (?, 'doc-a', 'doc-a', 'diagnoses', 'Twin', '{}', 500)`,
        )
        .run(id);
    add("twin-1");
    expect(() => add("twin-2")).not.toThrow();
  });
});
