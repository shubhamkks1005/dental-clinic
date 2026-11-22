import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";
import { HISTORY_CLINICAL_ENTRY_TYPES } from "./history-feed-visibility";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx) => createRepos(t.db, ctx);

const PATIENT_ID = "01M83PATIENTHISTPERM0001";
const VISIT_TYPE = "01M83VTYPE01CONSULT000001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009943', 'Fake Perm Patient', 'female', 29, '+919900001177', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("history feed receptionist filter (3.5.14)", () => {
  it("API/repo omits clinical types and clinical file kinds for receptionist", async () => {
    await repos(doctor).planItems.create({
      patientId: PATIENT_ID,
      procedureLabel: "RCT 46",
      estimatePaise: 800_000,
      toothFdi: 46,
      phase: 1,
      sittings: 2,
    });
    await repos(doctor).medicalHistory.save({
      patientId: PATIENT_ID,
      items: [
        {
          code: "hiv",
          label: "HIV",
          answer: "yes",
          alertLabel: "HIV",
          restricted: true,
        },
      ],
    });
    const visit = await repos(doctor).visits.open({
      patientId: PATIENT_ID,
      visitDateLocal: "2026-11-20",
    });
    await repos(doctor).visits.updateDraftFields(visit.id, 1, {
      chiefComplaint: "Secret note",
    });
    await repos(doctor).visitDiagnoses.add({ visitId: visit.id, freeText: "Abscess" });
    const final = await repos(doctor).visits.finalise(visit.id, { version: 2 });
    await repos(doctor).visits.addAddendum(final.id, {
      body: "Clinical addendum",
      reason: "Clarify",
    });
    await repos(doctor).consents.record(PATIENT_ID, {
      type: "privacy_notice",
      noticeVersion: 1,
      given: true,
      method: "form",
      givenAt: "2026-11-19T10:00:00.000Z",
    });
    t.sqlite
      .prepare(
        `INSERT INTO appointments (
           id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
           start_at, date_local, start_min, end_min, status, source, priority
         ) VALUES (
           '01M83APPTPERMTEST0000001', 'system', 'system', ?, '1', ?, 'Consultation',
           '2026-11-18T04:30:00.000Z', '2026-11-18', 600, 630, 'completed', 'phone', 'normal'
         )`,
      )
      .run(PATIENT_ID, VISIT_TYPE);
    t.sqlite
      .prepare(
        `INSERT INTO files (
           id, created_by, updated_by, patient_id, r2_key, kind, mime, bytes, sha256
         ) VALUES
         ('01M83FILEPERMIOPA0000001', 'system', 'system', ?, 'p/fake/iopa1', 'iopa', 'image/jpeg', 100,
          'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'),
         ('01M83FILEPERMSCAN0000001', 'system', 'system', ?, 'p/fake/scan1', 'scan', 'application/pdf', 200,
          'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc')`,
      )
      .run(PATIENT_ID, PATIENT_ID);

    const docPage = await repos(doctor).history.listFeed(PATIENT_ID, { limit: 50 });
    const docTypes = new Set(docPage.entries.map((e) => e.type));
    for (const t of HISTORY_CLINICAL_ENTRY_TYPES) expect(docTypes.has(t)).toBe(true);
    expect(docPage.entries.some((e) => e.type === "file" && e.status === "iopa")).toBe(true);

    const recPage = await repos(receptionist).history.listFeed(PATIENT_ID, { limit: 50 });
    for (const entry of recPage.entries) {
      expect(HISTORY_CLINICAL_ENTRY_TYPES.includes(entry.type as never)).toBe(false);
      expect(entry.summary).not.toMatch(/Secret note|Abscess|HIV|Clinical addendum|RCT 46/i);
      if (entry.type === "file") {
        expect(["scan", "consent"]).toContain(entry.status);
      }
    }
    expect(recPage.entries.some((e) => e.type === "appointment")).toBe(true);
    expect(recPage.entries.some((e) => e.type === "consent")).toBe(true);
    expect(recPage.entries.some((e) => e.type === "file" && e.status === "scan")).toBe(true);
    expect(recPage.entries.some((e) => e.type === "file" && e.status === "iopa")).toBe(false);
  });
});
