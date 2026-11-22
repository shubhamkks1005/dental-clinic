import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ConflictError, ForbiddenError, InvalidError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

const PATIENT_ID = "01M83PATIENTPATCHTEST01";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009912', 'Fake Patch Patient', 'female', 28, '+919900001133', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("visits updateDraftFields (3.5.3)", () => {
  it("saves notes and vitals, bumps version, forbids receptionist", async () => {
    const opened = await repos().visits.open({
      patientId: PATIENT_ID,
      visitDateLocal: "2026-11-22",
    });
    const saved = await repos().visits.updateDraftFields(opened.id, opened.version, {
      chiefComplaint: "Sensitivity",
      examNote: "36 occlusal caries",
      advice: "Desensitising paste",
      pulse: 72,
    });
    expect(saved.chiefComplaint).toBe("Sensitivity");
    expect(saved.pulse).toBe(72);
    expect(saved.version).toBe(opened.version + 1);

    await expect(
      repos(receptionist).visits.updateDraftFields(opened.id, saved.version, {
        advice: "Nope",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    await expect(
      repos().visits.updateDraftFields(opened.id, opened.version, { advice: "stale" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("blocks patch after finalise", async () => {
    const opened = await repos().visits.open({
      patientId: PATIENT_ID,
      visitDateLocal: "2026-11-22",
    });
    const patched = await repos().visits.updateDraftFields(opened.id, opened.version, {
      chiefComplaint: "Check",
    });
    const final = await repos().visits.finalise(opened.id, { version: patched.version });
    await expect(
      repos().visits.updateDraftFields(opened.id, final.version, { advice: "late" }),
    ).rejects.toBeInstanceOf(InvalidError);
  });
});
