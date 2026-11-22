import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError, InvalidError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

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

describe("plan items (3.2.5 / 3.6)", () => {
  it("creates an item and requires a reason when raising the estimate (3.6.5)", async () => {
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

  it("lists items and blocks accepted without toldOn (3.6.1 / 3.6.2)", async () => {
    await repos().planItems.create({
      patientId: PATIENT_ID,
      procedureLabel: "Filling 36",
      estimatePaise: 150_000,
      toothFdi: 36,
      phase: 1,
      sittings: 1,
    });
    const listed = await repos().planItems.listForPatient(PATIENT_ID);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.procedureLabel).toBe("Filling 36");

    await expect(
      repos().planItems.setDecision(listed[0]!.id, {
        status: "accepted",
        version: 1,
      }),
    ).rejects.toBeInstanceOf(InvalidError);

    const accepted = await repos().planItems.setDecision(listed[0]!.id, {
      status: "accepted",
      toldOn: "2026-11-22",
      version: 1,
    });
    expect(accepted.status).toBe("accepted");

    await expect(repos(receptionist).planItems.listForPatient(PATIENT_ID)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});
