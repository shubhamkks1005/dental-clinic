import { newUlid } from "@clinic/shared";
import { afterAll, describe, expect, it } from "vitest";
import { patients } from "../schema";
import { queryPlan } from "../testing";
import { testDb } from "../testing/test-db";
import { rebuildPatientSearchStatements } from "./patient-tokens";

const { db, sqlite } = testDb();
afterAll(() => sqlite.close());

describe("rebuildPatientSearchStatements (2.1.6)", () => {
  it("writes name and mobile tokens for a patient", async () => {
    const id = newUlid();
    await db.insert(patients).values({
      id,
      code: "P-000099",
      fullName: "Fake Person",
      gender: "male",
      ageYearsAtReg: 40,
      mobile: "+919000001111",
      createdBy: "system",
      updatedBy: "system",
    });
    const stmts = rebuildPatientSearchStatements(
      db,
      id,
      {
        fullName: "Fake Person",
        code: "P-000099",
        mobile: "+919000001111",
        mobileSecondary: null,
        legacyRef: null,
      },
      "system",
    );
    await db.batch([...stmts]);
    const rows = sqlite
      .prepare("SELECT token, kind FROM patient_search WHERE patient_id = ? ORDER BY kind, token")
      .all(id) as { token: string; kind: string }[];
    expect(rows.some((r) => r.kind === "name" && r.token === "fake")).toBe(true);
    expect(rows.some((r) => r.kind === "mobile" && r.token === "9000001111")).toBe(true);
  });

  it("token range query uses the token index", () => {
    const plan = queryPlan(
      sqlite,
      "SELECT DISTINCT patient_id FROM patient_search WHERE token >= ? AND token < ?",
      ["fake", "fakf"],
    );
    expect(plan.some((line) => /patient_search_token_idx/i.test(line))).toBe(true);
    expect(plan.every((line) => !/^SCAN patient_search$/i.test(line))).toBe(true);
  });
});
