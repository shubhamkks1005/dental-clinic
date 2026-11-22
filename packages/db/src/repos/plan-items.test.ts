import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { InvalidError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };

let t: ReturnType<typeof testDb>;
const repos = () => createRepos(t.db, doctor);

const PATIENT_ID = "01M83PATIENTPLANTEST001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009906', 'Fake Plan Patient', 'female', 28, '+919900001555', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("plan items (3.2.5)", () => {
  it("creates an item and requires a reason when raising the estimate", async () => {
    const item = await repos().planItems.create({
      patientId: PATIENT_ID,
      procedureLabel: "Crown 46",
      estimatePaise: 500_000,
      toothFdi: 46,
      phase: 3,
      sittings: 2,
    });
    expect(item.estimatePaise).toBe(500_000);

    await expect(
      repos().planItems.changeEstimate(item.id, {
        estimatePaise: 600_000,
        reason: "   ",
        version: 1,
      }),
    ).rejects.toBeInstanceOf(InvalidError);

    const raised = await repos().planItems.changeEstimate(item.id, {
      estimatePaise: 600_000,
      reason: "Extra build-up needed",
      version: 1,
    });
    expect(raised.estimatePaise).toBe(600_000);
    expect(raised.version).toBe(2);

    const versions = t.sqlite
      .prepare(`SELECT estimate_paise, reason FROM plan_item_versions WHERE plan_item_id = ?`)
      .all(item.id) as { estimate_paise: number; reason: string }[];
    expect(versions).toEqual([{ estimate_paise: 500_000, reason: "Extra build-up needed" }]);
  });
});
