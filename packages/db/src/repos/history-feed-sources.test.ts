import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

const PATIENT_ID = "01M83PATIENTHISTSRC00001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009942', 'Fake Source Patient', 'female', 32, '+919900001166', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("history feed stage-1 sources (3.5.13)", () => {
  it("includes treatments, medical changes, consents, amendments; empty files do not crash", async () => {
    await repos().planItems.create({
      patientId: PATIENT_ID,
      procedureLabel: "Filling 36",
      estimatePaise: 150_000,
      toothFdi: 36,
      phase: 1,
      sittings: 1,
    });

    await repos().medicalHistory.save({
      patientId: PATIENT_ID,
      items: [
        {
          code: "diabetes",
          label: "Diabetes",
          answer: "yes",
          alertLabel: "Diabetes",
          restricted: false,
        },
      ],
    });
    await repos().medicalHistory.save({
      patientId: PATIENT_ID,
      items: [{ code: "diabetes", label: "Diabetes", answer: "no" }],
    });

    await repos().consents.record(PATIENT_ID, {
      type: "privacy_notice",
      noticeVersion: 1,
      given: true,
      method: "form",
      givenAt: "2026-11-20T10:00:00.000Z",
    });

    const visit = await repos().visits.open({
      patientId: PATIENT_ID,
      visitDateLocal: "2026-11-21",
    });
    await repos().visits.updateDraftFields(visit.id, 1, { chiefComplaint: "Tooth pain" });
    await repos().visitDiagnoses.add({
      visitId: visit.id,
      freeText: "Pulpitis",
    });
    const final = await repos().visits.finalise(visit.id, { version: 2 });
    await repos().visits.addAddendum(final.id, {
      body: "Clarified lower left molar.",
      reason: "Missed detail",
    });

    const page = await repos().history.listFeed(PATIENT_ID, { limit: 30 });
    const types = new Set(page.entries.map((e) => e.type));
    expect(types.has("treatment")).toBe(true);
    expect(types.has("medical_change")).toBe(true);
    expect(types.has("consent")).toBe(true);
    expect(types.has("amendment")).toBe(true);
    expect(types.has("visit")).toBe(true);
    expect(types.has("file")).toBe(false);

    const treatment = page.entries.find((e) => e.type === "treatment");
    expect(treatment?.summary).toContain("Filling 36");
    expect(treatment?.summary).toContain("36");
    expect(treatment?.href).toContain(PATIENT_ID);

    const medical = page.entries.filter((e) => e.type === "medical_change");
    expect(medical.length).toBe(2);
    expect(medical.some((e) => e.summary.includes("yes→no"))).toBe(true);

    const consent = page.entries.find((e) => e.type === "consent");
    expect(consent?.summary).toContain("given");
    expect(consent?.href).toContain("/consents");

    const amendment = page.entries.find((e) => e.type === "amendment");
    expect(amendment?.summary).toContain("Clarified");
    expect(amendment?.href).toBe(`/app/visits/${visit.id}`);

    const visitRow = page.entries.find((e) => e.type === "visit");
    expect(visitRow?.summary).toContain("Tooth pain");
    expect(visitRow?.summary).toContain("Pulpitis");
  });

  it("lists a file row when metadata exists (upload API still 3.7)", async () => {
    t.sqlite
      .prepare(
        `INSERT INTO files (
           id, created_by, updated_by, patient_id, r2_key, kind, mime, bytes, sha256
         ) VALUES (
           '01M83FILEHISTTEST00000001', 'system', 'system', ?,
           'p/fake/01M83FILEHISTTEST00000001', 'scan', 'image/jpeg', 1200,
           'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
         )`,
      )
      .run(PATIENT_ID);

    const page = await repos().history.listFeed(PATIENT_ID, { limit: 10 });
    const file = page.entries.find((e) => e.type === "file");
    expect(file).toBeDefined();
    expect(file?.summary).toContain("scan");
    expect(file?.href).toContain("tab=files");
  });
});
