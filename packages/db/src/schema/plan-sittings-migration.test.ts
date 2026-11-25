import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { DB_MIGRATIONS } from "../testing/paths";

// 0061 must work on a database that already has plan items and procedure lines.
describe("0061 on a database that already has plan items and procedure lines", () => {
  it("keeps the rows, starts both counters at 0 and refuses bad values", () => {
    const old = new DatabaseSync(":memory:");
    const files = readdirSync(DB_MIGRATIONS)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const file of files.filter((f) => f < "0061")) {
      old.exec(readFileSync(`${DB_MIGRATIONS}${file}`, "utf8"));
    }
    old
      .prepare(
        `INSERT INTO plan_items (id, created_by, updated_by, patient_id, procedure_label, estimate_paise, sittings)
         VALUES ('pi1', 's', 's', 'p', 'RCT', 100, 3)`,
      )
      .run();
    old
      .prepare(
        `INSERT INTO visit_procedures (id, created_by, updated_by, visit_id, label) VALUES ('vp1', 's', 's', 'v', 'RCT')`,
      )
      .run();
    const file61 = files.find((f) => f.startsWith("0061")) as string;
    old.exec(readFileSync(`${DB_MIGRATIONS}${file61}`, "utf8"));
    expect(old.prepare("SELECT sittings, sittings_done FROM plan_items").get()).toMatchObject({
      sittings: 3,
      sittings_done: 0,
    });
    expect(old.prepare("SELECT more_sittings FROM visit_procedures").get()).toMatchObject({
      more_sittings: 0,
    });
    expect(() => old.exec("UPDATE plan_items SET sittings_done = -1")).toThrow();
    expect(() => old.exec("UPDATE visit_procedures SET more_sittings = 2")).toThrow();
    old.close();
  });
});
