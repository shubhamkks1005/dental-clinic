import { describe, expect, it } from "vitest";
import { buildLocalPatientSeedSql, SEED_BATCH_SIZE } from "./seed-sql";

describe("buildLocalPatientSeedSql (1.1.7)", () => {
  it("clears prior seed rows, inserts in batches, and bumps the patient_code counter", () => {
    const sql = buildLocalPatientSeedSql(250, 1);
    expect(sql[0]).toBe("DELETE FROM patients WHERE id LIKE 'seed%';");
    expect(sql.at(-1)).toContain("patient_code");
    expect(sql.at(-1)).toContain("250");
    const inserts = sql.slice(1, -1);
    expect(inserts).toHaveLength(Math.ceil(250 / SEED_BATCH_SIZE));
    expect(inserts.every((s) => s.startsWith("INSERT INTO patients"))).toBe(true);
    expect(sql.join("\n")).toContain("P-000001");
    expect(sql.join("\n")).toContain("+919000000000");
  });

  it("quotes every string value so a name cannot break out of SQL", () => {
    const insert = buildLocalPatientSeedSql(1, 1)[1] ?? "";
    expect(insert).toContain("'seed0000000000000000000001'");
    expect(insert).toContain("'P-000001'");
    expect(insert).toMatch(/'\+91\d{10}'/);
    expect(insert).toContain("'active'");
  });
});
