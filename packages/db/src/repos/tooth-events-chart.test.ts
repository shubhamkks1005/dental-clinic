import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };

let t: ReturnType<typeof testDb>;
const repos = () => createRepos(t.db, doctor);
const PATIENT_ID = "01M83PATIENTCHARTASOF01";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009904', 'Fake Chart History', 'female', 30, '+919900001333', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("chart as-of history (3.4.5)", () => {
  it("shows older chart when asOf a finalised visit, and highlights today's change", async () => {
    const v1 = await repos().visits.open({
      patientId: PATIENT_ID,
      visitDateLocal: "2026-01-10",
    });
    await repos().toothEvents.add({
      patientId: PATIENT_ID,
      visitId: v1.id,
      toothFdi: 16,
      surface: "o",
      conditionCode: "caries",
      notedAt: "2026-01-10T05:00:00.000Z",
    });
    await repos().toothEvents.add({
      patientId: PATIENT_ID,
      visitId: v1.id,
      toothFdi: 26,
      surface: "o",
      conditionCode: "caries",
      notedAt: "2026-01-10T05:01:00.000Z",
    });
    await repos().toothEvents.add({
      patientId: PATIENT_ID,
      visitId: v1.id,
      toothFdi: 36,
      surface: "o",
      conditionCode: "filling",
      notedAt: "2026-01-10T05:02:00.000Z",
    });
    const final1 = await repos().visits.finalise(v1.id, { version: v1.version });

    const draft = await repos().visits.open({
      patientId: PATIENT_ID,
      visitDateLocal: "2026-11-23",
    });
    await repos().toothEvents.add({
      patientId: PATIENT_ID,
      visitId: draft.id,
      toothFdi: 16,
      surface: "o",
      conditionCode: "filling",
    });

    const current = await repos().toothEvents.chartForPatient(PATIENT_ID, {
      highlightVisitId: draft.id,
    });
    expect(current.cells.find((c) => c.toothFdi === 16)?.conditionCode).toBe("filling");
    expect(current.cells.find((c) => c.toothFdi === 16)?.changedToday).toBe(true);
    expect(current.history.some((h) => h.id === final1.id)).toBe(true);

    const old = await repos().toothEvents.chartForPatient(PATIENT_ID, {
      asOfVisitId: final1.id,
    });
    expect(old.asOfVisitId).toBe(final1.id);
    expect(old.cells.find((c) => c.toothFdi === 16)?.conditionCode).toBe("caries");
    expect(old.cells.find((c) => c.toothFdi === 26)?.conditionCode).toBe("caries");
    expect(old.cells.find((c) => c.toothFdi === 36)?.conditionCode).toBe("filling");
  });
});
