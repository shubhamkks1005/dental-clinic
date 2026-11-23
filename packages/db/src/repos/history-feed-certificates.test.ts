import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);
const PATIENT_ID = "01M83PATIENTCERTHIST001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009908', 'Fake Hist Cert', 'male', 40, '+919900001557', 'active')`,
    )
    .run(PATIENT_ID);
  t.sqlite
    .prepare(`UPDATE settings SET value_json = '"A-99999"' WHERE key = 'doctor.registration_no'`)
    .run();
});

describe("history feed certificates (4.4.3)", () => {
  it("doctor sees reason; receptionist sees cert number only with print href", async () => {
    const draft = await repos().certificates.create({
      patientId: PATIENT_ID,
      patientName: "Fake Hist Cert",
      patientAge: "40 yrs",
      patientAddress: "",
      identificationMark: "Scar",
      signMethod: "signature",
      reason: "Rest after scaling",
      fromOn: "2026-11-20",
      toOn: "2026-11-21",
      diagnosis: "Gingivitis",
    });
    const final = await repos().certificates.finalise(draft.id, draft.version);

    const docPage = await repos(doctor).history.listFeed(PATIENT_ID);
    const docCert = docPage.entries.find((e) => e.type === "certificate");
    expect(docCert?.summary).toContain(final.certNo);
    expect(docCert?.summary).toContain("Rest after scaling");
    expect(docCert?.href).toContain(`/print/certificate/${final.id}`);

    const recPage = await repos(receptionist).history.listFeed(PATIENT_ID);
    const recCert = recPage.entries.find((e) => e.type === "certificate");
    expect(recCert?.summary).toBe(final.certNo);
    expect(recCert?.summary).not.toContain("Gingivitis");
    expect(recCert?.summary).not.toContain("Rest after scaling");
    expect(recCert?.href).toContain(`/print/certificate/${final.id}`);
  });
});
