import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { DB_MIGRATIONS } from "../testing/paths";

// B4: 0058 must work on a database that already has visits (an older scratch DB).
describe("0058 on a database that already has visits", () => {
  it("keeps every visit, defaults both flags to 0 and refuses other values", () => {
    const old = new DatabaseSync(":memory:");
    const files = readdirSync(DB_MIGRATIONS)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const file of files.filter((f) => f < "0058")) {
      old.exec(readFileSync(`${DB_MIGRATIONS}${file}`, "utf8"));
    }
    old
      .prepare(
        `INSERT INTO visits (id, created_by, updated_by, patient_id, doctor_id, visit_date_local, status)
         VALUES ('old1', 's', 's', 'p', 'd', '2026-11-20', 'final')`,
      )
      .run();
    const file58 = files.find((f) => f.startsWith("0058")) as string;
    old.exec(readFileSync(`${DB_MIGRATIONS}${file58}`, "utf8"));
    expect(
      old.prepare("SELECT status, no_diagnosis, no_procedure FROM visits").get(),
    ).toMatchObject({
      status: "final",
      no_diagnosis: 0,
      no_procedure: 0,
    });
    expect(() => old.exec("UPDATE visits SET no_diagnosis = 2")).toThrow();
    old.close();
  });
});
