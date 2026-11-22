import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };

let t: ReturnType<typeof testDb>;
const repos = () => createRepos(t.db, doctor);

const PATIENT_ID = "01M83PATIENTPLANSYNC0001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009944', 'Fake Sync Patient', 'female', 33, '+919900001188', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("plan sync on finalise (3.6.4)", () => {
  it("completes a matching plan item and creates one for an unmatched procedure", async () => {
    const listed = await repos().lists.add("procedures", {
      label: "Sync filling (test)",
      data: { default_paise: 150000, code: "SYNC_F" },
    });
    const filling = listed.find((i) => i.label === "Sync filling (test)")!;
    const listed2 = await repos().lists.add("procedures", {
      label: "Sync scaling (test)",
      data: { default_paise: 80000, code: "SYNC_S" },
    });
    const scaling = listed2.find((i) => i.label === "Sync scaling (test)")!;

    const planned = await repos().planItems.create({
      patientId: PATIENT_ID,
      procedureLabel: "Sync filling (test)",
      listItemId: filling.id,
      estimatePaise: 150_000,
      toothFdi: 36,
      phase: 1,
      sittings: 1,
    });

    const visit = await repos().visits.open({
      patientId: PATIENT_ID,
      visitDateLocal: "2026-11-22",
    });
    await repos().visitProcedures.add({
      visitId: visit.id,
      listItemId: filling.id,
      toothFdi: 36,
      surfaces: ["o"],
    });
    await repos().visitProcedures.add({
      visitId: visit.id,
      listItemId: scaling.id,
      surfaces: [],
    });
    await repos().visits.finalise(visit.id, { version: 1 });

    const items = await repos().planItems.listForPatient(PATIENT_ID);
    const filled = items.find((i) => i.id === planned.id);
    expect(filled?.status).toBe("completed");
    expect(filled?.completedVisitId).toBe(visit.id);

    const scalingItem = items.find((i) => i.procedureLabel === "Sync scaling (test)");
    expect(scalingItem?.status).toBe("completed");
    expect(scalingItem?.completedVisitId).toBe(visit.id);
  });
});
