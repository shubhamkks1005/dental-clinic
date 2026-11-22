import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError, NotFoundError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

const PATIENT_ID = "01M83PATIENTVISITGET01";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009911', 'Fake Get Visit', 'female', 30, '+919900001122', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("visits get (3.2.7)", () => {
  it("doctor reads a visit; receptionist is forbidden", async () => {
    const opened = await repos().visits.open({
      patientId: PATIENT_ID,
      visitDateLocal: "2026-11-22",
    });
    const got = await repos().visits.getById(opened.id);
    expect(got.id).toBe(opened.id);
    expect(got.chiefComplaint).toBeNull();

    await expect(repos(receptionist).visits.getById(opened.id)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(repos().visits.getById("missing")).rejects.toBeInstanceOf(NotFoundError);
  });
});
