import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { InvalidError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };

let t: ReturnType<typeof testDb>;
const repos = () => createRepos(t.db, doctor);

const PATIENT_ID = "01M83PATIENTFINALTEST01";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009907', 'Fake Final Patient', 'female', 35, '+919900001666', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("visit finalise (3.2.6)", () => {
  it("finalises with snapshot hash and blocks further draft edits", async () => {
    const visit = await repos().visits.open({
      patientId: PATIENT_ID,
      visitDateLocal: "2026-11-22",
    });
    await repos().visits.updateDraftFields(visit.id, 1, { chiefComplaint: "Pain" });
    const final = await repos().visits.finalise(visit.id, { version: 2 });
    expect(final.status).toBe("final");
    expect(final.snapshotHash).toMatch(/^[a-f0-9]{64}$/);

    await expect(
      repos().visits.updateDraftFields(visit.id, final.version, { chiefComplaint: "Changed" }),
    ).rejects.toBeInstanceOf(InvalidError);

    // Direct SQL UPDATE of a finalised clinical field is not done by the app; repo refuses.
    // Addendum still works.
    const note = await repos().visits.addAddendum(visit.id, {
      body: "Clarified occlusal wear.",
      reason: "Missed in note",
    });
    expect(note.body).toContain("occlusal");
    const count = t.sqlite
      .prepare(`SELECT COUNT(*) AS n FROM visit_addenda WHERE visit_id = ?`)
      .get(visit.id) as { n: number };
    expect(count.n).toBe(1);
  });

  it("documents that D1 trigger lock is not used (repo guard only)", () => {
    // Spike: SQLite/D1 can run triggers, but we keep lock in the repository so tests stay
    // portable and we avoid trigger + soft-delete complexity. See DECISIONS.md.
    expect(true).toBe(true);
  });
});
