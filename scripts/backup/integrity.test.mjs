import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkDumpSql } from "./integrity.mjs";

const migrations = join(dirname(fileURLToPath(import.meta.url)), "../../packages/db/migrations");

describe("backup integrity (1.6.3)", () => {
  it("accepts a dump built from our migrations", () => {
    const sql = readdirSync(migrations)
      .filter((f) => f.endsWith(".sql"))
      .sort()
      .map((f) => readFileSync(join(migrations, f), "utf8"))
      .join("\n");
    const result = checkDumpSql(sql);
    expect(result.tables).toEqual(expect.arrayContaining(["users", "settings", "list_items"]));
  });

  it("refuses a dump with no tables", () => {
    expect(() => checkDumpSql("SELECT 1;")).toThrow(/missing tables/i);
  });
});
