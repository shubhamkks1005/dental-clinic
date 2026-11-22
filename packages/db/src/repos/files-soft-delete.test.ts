import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const PATIENT_ID = "01M83FILESOFTDEL000000001";

let t: ReturnType<typeof testDb>;
const repos = () => createRepos(t.db, doctor);

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-000501', 'Fake Soft Del', 'female', 40, '+919000000501', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("files soft delete (3.7.7)", () => {
  it("removes from listing but keeps audit row", async () => {
    const row = await repos().files.insert({
      patientId: PATIENT_ID,
      objectKey: "f/soft-del-1",
      kind: "scan",
      mime: "image/jpeg",
      bytes: 100,
      sha256: "a".repeat(64),
      originalFilename: "scan.jpg",
    });

    await repos().files.softDelete(row.id);
    const list = await repos().files.listForPatient(PATIENT_ID);
    expect(list.find((f) => f.id === row.id)).toBeUndefined();

    const audit = t.sqlite
      .prepare(
        `SELECT action FROM audit_log WHERE table_name = 'files' AND row_id = ? ORDER BY created_at`,
      )
      .all(row.id) as { action: string }[];
    expect(audit.map((a) => a.action)).toEqual(["create", "delete"]);
  });
});
