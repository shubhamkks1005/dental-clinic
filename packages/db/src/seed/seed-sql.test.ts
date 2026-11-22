import { describe, expect, it } from "vitest";
import { buildLocalPatientSeedSql, SEED_BATCH_SIZE } from "./seed-sql";

describe("buildLocalPatientSeedSql (1.1.7)", () => {
  it("clears prior seed rows, inserts patients and search tokens, and bumps the counter", () => {
    const sql = buildLocalPatientSeedSql(250, 1);
    expect(sql[0]).toBe("DELETE FROM patient_search WHERE patient_id LIKE 'seed%';");
    expect(sql[1]).toBe("DELETE FROM patients WHERE id LIKE 'seed%';");
    expect(sql.at(-1)).toContain("patient_code");
    expect(sql.at(-1)).toContain("250");
    expect(sql.some((s) => s.startsWith("INSERT INTO patients"))).toBe(true);
    expect(sql.some((s) => s.startsWith("INSERT INTO patient_search"))).toBe(true);
    expect(sql.join("\n")).toContain("P-000001");
    expect(sql.join("\n")).toContain("+919000000000");
    expect(SEED_BATCH_SIZE).toBe(100);
  });

  it("quotes every string value so a name cannot break out of SQL", () => {
    const sql = buildLocalPatientSeedSql(1, 1);
    const insert = sql.find((s) => s.startsWith("INSERT INTO patients")) ?? "";
    expect(insert).toContain("'seed0000000000000000000001'");
    expect(insert).toContain("'P-000001'");
    expect(insert).toMatch(/'\+91\d{10}'/);
    expect(insert).toContain("'active'");
  });
});
