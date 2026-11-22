import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

const PATIENT_ID = "01M83PATIENTDXTEST00001";

beforeEach(async () => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009904', 'Fake Dx Patient', 'female', 30, '+919900001333', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("visit diagnoses + diagnoses list (3.2.3)", () => {
  it("a new diagnosis list item appears immediately and can be attached to a visit", async () => {
    const listed = await repos().lists.add("diagnoses", {
      label: "Acute apical abscess",
      data: {},
    });
    const item = listed.find((i) => i.label === "Acute apical abscess");
    expect(item).toBeDefined();
    expect(listed.some((i) => i.label === "Acute apical abscess")).toBe(true);

    const visit = await repos().visits.open({
      patientId: PATIENT_ID,
      visitDateLocal: "2026-11-22",
    });
    const dx = await repos().visitDiagnoses.add({
      visitId: visit.id,
      listItemId: item!.id,
    });
    expect(dx.label).toBe("Acute apical abscess");
    const onVisit = await repos().visitDiagnoses.listForVisit(visit.id);
    expect(onVisit.map((d) => d.label)).toEqual(["Acute apical abscess"]);
  });

  it("allows free-text diagnosis without a list item", async () => {
    const visit = await repos().visits.open({
      patientId: PATIENT_ID,
      visitDateLocal: "2026-11-22",
    });
    const dx = await repos().visitDiagnoses.add({
      visitId: visit.id,
      freeText: "Irreversible pulpitis 46",
      toothFdi: 46,
    });
    expect(dx).toMatchObject({ label: "Irreversible pulpitis 46", toothFdi: 46, listItemId: null });
  });
});
