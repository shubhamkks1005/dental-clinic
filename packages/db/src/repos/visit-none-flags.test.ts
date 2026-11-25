import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { InvalidError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };

let t: ReturnType<typeof testDb>;
const repos = () => createRepos(t.db, doctor);

const PATIENT_ID = "01M83PATIENTNONEFLAG001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009931', 'Fake Flag Patient', 'male', 41, '+919900001666', 'active')`,
    )
    .run(PATIENT_ID);
});

async function openVisit() {
  return repos().visits.open({ patientId: PATIENT_ID, visitDateLocal: "2026-11-25" });
}

describe("No diagnosis / No procedure flags (B4, Q2)", () => {
  it("both flags start false and can be set and cleared", async () => {
    const visit = await openVisit();
    expect(await repos().visits.getById(visit.id)).toMatchObject({
      noDiagnosis: false,
      noProcedure: false,
    });
    const a = await repos().visits.updateDraftFields(visit.id, visit.version, {
      noDiagnosis: true,
      noProcedure: true,
    });
    expect(a).toMatchObject({ noDiagnosis: true, noProcedure: true, version: visit.version + 1 });
    const b = await repos().visits.updateDraftFields(visit.id, a.version, { noDiagnosis: false });
    expect(b).toMatchObject({ noDiagnosis: false, noProcedure: true });
    expect(await repos().visits.getById(visit.id)).toMatchObject({
      noDiagnosis: false,
      noProcedure: true,
    });
  });

  it("refuses No diagnosis while a diagnosis exists (case 8 for diagnoses)", async () => {
    const visit = await openVisit();
    await repos().visitDiagnoses.add({ visitId: visit.id, freeText: "Caries" });
    await expect(
      repos().visits.updateDraftFields(visit.id, visit.version, { noDiagnosis: true }),
    ).rejects.toBeInstanceOf(InvalidError);
    const fresh = await repos().visits.getById(visit.id);
    expect(fresh.noDiagnosis).toBe(false);
  });

  it("refuses No procedure while a procedure exists", async () => {
    const list = await repos().lists.add("procedures", {
      label: "Flag filling (test)",
      data: { code: "FLG", default_paise: 50000 },
    });
    const item = list.find((i) => i.label === "Flag filling (test)")!;
    const visit = await openVisit();
    await repos().visitProcedures.add({ visitId: visit.id, listItemId: item.id });
    await expect(
      repos().visits.updateDraftFields(visit.id, visit.version, { noProcedure: true }),
    ).rejects.toBeInstanceOf(InvalidError);
  });

  it("adding a line clears the flag without changing the visit version", async () => {
    const visit = await openVisit();
    const a = await repos().visits.updateDraftFields(visit.id, visit.version, {
      noDiagnosis: true,
    });
    await repos().visitDiagnoses.add({ visitId: visit.id, freeText: "Caries" });
    const after = await repos().visits.getById(visit.id);
    expect(after.noDiagnosis).toBe(false);
    expect(after.version).toBe(a.version);
  });

  it("restoring a removed line clears the flag", async () => {
    const visit = await openVisit();
    const dx = await repos().visitDiagnoses.add({ visitId: visit.id, freeText: "Caries" });
    const gone = await repos().visitDiagnoses.remove(dx.id, dx.version);
    await repos().visits.updateDraftFields(visit.id, visit.version, { noDiagnosis: true });
    await repos().visitDiagnoses.restore(dx.id, gone.version);
    expect((await repos().visits.getById(visit.id)).noDiagnosis).toBe(false);
  });

  it("the finalised snapshot keeps the flag", async () => {
    const visit = await openVisit();
    const a = await repos().visits.updateDraftFields(visit.id, visit.version, {
      noDiagnosis: true,
    });
    await repos().visits.finalise(visit.id, { version: a.version });
    const row = t.sqlite
      .prepare("SELECT snapshot_json AS s, no_diagnosis AS n FROM visits WHERE id = ?")
      .get(visit.id) as { s: string; n: number };
    expect(row.n).toBe(1);
    expect((JSON.parse(row.s) as { visit: { noDiagnosis: boolean } }).visit.noDiagnosis).toBe(true);
  });
});
