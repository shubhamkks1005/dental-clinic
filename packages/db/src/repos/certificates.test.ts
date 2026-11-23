import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError, InvalidError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

const PATIENT_ID = "01M83PATIENTCERTTEST001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status, area)
       VALUES (?, 'system', 'system', 'P-009907', 'Fake Cert Patient', 'female', 28, '+919900001556', 'active', 'Test Area')`,
    )
    .run(PATIENT_ID);
  t.sqlite
    .prepare(`UPDATE settings SET value_json = '"A-12345"' WHERE key = 'doctor.registration_no'`)
    .run();
});

describe("certificates (4.4.3)", () => {
  it("finalises with gap-free number; receptionist cannot write or see diagnosis", async () => {
    const draft = await repos().certificates.create({
      patientId: PATIENT_ID,
      patientName: "Fake Cert Patient",
      patientAge: "28 yrs",
      patientAddress: "Test Area",
      identificationMark: "Mole on chin",
      signMethod: "signature",
      reason: "Rest after extraction",
      fromOn: "2026-11-20",
      toOn: "2026-11-22",
      diagnosis: "Irreversible pulpitis",
    });
    expect(draft.status).toBe("draft");
    expect(draft.diagnosis).toBe("Irreversible pulpitis");

    await expect(
      repos(receptionist).certificates.create({
        patientId: PATIENT_ID,
        patientName: "Fake Cert Patient",
        patientAge: "28 yrs",
        patientAddress: "Test Area",
        identificationMark: "Mole",
        signMethod: "thumb",
        reason: "Rest",
        fromOn: "2026-11-20",
        toOn: "2026-11-22",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    const final = await repos().certificates.finalise(draft.id, draft.version);
    expect(final.status).toBe("finalised");
    expect(final.certNo).toMatch(/^MC-\d{4}-\d{2}-\d{4}$/);
    expect(final.doctorRegistrationNo).toBe("A-12345");

    const asRec = await repos(receptionist).certificates.get(final.id);
    expect(asRec.diagnosis).toBeNull();
    expect(asRec.certNo).toBe(final.certNo);

    await expect(
      repos(receptionist).certificates.finalise(final.id, final.version),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("blocks finalise when registration number is empty", async () => {
    t.sqlite
      .prepare(`UPDATE settings SET value_json = '""' WHERE key = 'doctor.registration_no'`)
      .run();
    const draft = await repos().certificates.create({
      patientId: PATIENT_ID,
      patientName: "Fake Cert Patient",
      patientAge: "28 yrs",
      patientAddress: "",
      identificationMark: "Scar",
      signMethod: "thumb",
      reason: "Rest",
      fromOn: "2026-11-20",
      toOn: "2026-11-21",
    });
    await expect(repos().certificates.finalise(draft.id, draft.version)).rejects.toBeInstanceOf(
      InvalidError,
    );
  });

  it("revise keeps old finalised row and creates a new draft", async () => {
    const draft = await repos().certificates.create({
      patientId: PATIENT_ID,
      patientName: "Fake Cert Patient",
      patientAge: "28 yrs",
      patientAddress: "",
      identificationMark: "Scar",
      signMethod: "signature",
      reason: "Rest",
      fromOn: "2026-11-20",
      toOn: "2026-11-21",
    });
    const final = await repos().certificates.finalise(draft.id, draft.version);
    const revised = await repos().certificates.revise(final.id);
    expect(revised.status).toBe("draft");
    expect(revised.revisedFromId).toBe(final.id);
    const old = await repos().certificates.get(final.id);
    expect(old.status).toBe("finalised");
    expect(old.certNo).toBe(final.certNo);
  });
});
