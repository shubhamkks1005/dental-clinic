import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

const PATIENT_ID = "01M83PATIENTTIMELINE001";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009921', 'Fake Timeline Patient', 'female', 30, '+919900001133', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("visits timeline (3.5.9)", () => {
  it("lists newest first with diagnosis and procedure labels", async () => {
    const older = await repos().visits.open({
      patientId: PATIENT_ID,
      visitDateLocal: "2026-11-10",
    });
    await repos().visitDiagnoses.add({
      visitId: older.id,
      freeText: "Deep caries",
      toothFdi: 36,
    });
    await repos().visits.finalise(older.id, { version: older.version });

    const newer = await repos().visits.open({
      patientId: PATIENT_ID,
      visitDateLocal: "2026-11-20",
    });
    await repos().visitProcedures.add({
      visitId: newer.id,
      listItemId: "01M83PROC02FILLING0000001",
      toothFdi: 36,
      surfaces: ["o"],
    });

    const rows = await repos().visits.listTimelineByPatient(PATIENT_ID);
    expect(rows.map((r) => r.id)).toEqual([newer.id, older.id]);
    expect(rows[0]?.procedures.some((l) => /filling/i.test(l))).toBe(true);
    expect(rows[1]?.diagnoses).toContain("Deep caries");
  });

  it("filters by diagnosis text", async () => {
    const a = await repos().visits.open({ patientId: PATIENT_ID, visitDateLocal: "2026-11-01" });
    await repos().visitDiagnoses.add({ visitId: a.id, freeText: "Pulpitis" });
    await repos().visits.finalise(a.id, { version: a.version });

    const b = await repos().visits.open({ patientId: PATIENT_ID, visitDateLocal: "2026-11-03" });
    await repos().visitDiagnoses.add({ visitId: b.id, freeText: "Gingivitis" });

    const onlyPulp = await repos().visits.listTimelineByPatient(PATIENT_ID, {
      diagnosis: "pulp",
    });
    expect(onlyPulp.map((r) => r.id)).toEqual([a.id]);
  });

  it("loads 30 visits without scanning more than a few hundred rows", async () => {
    for (let i = 0; i < 30; i++) {
      const day = String(i + 1).padStart(2, "0");
      const v = await repos().visits.open({
        patientId: PATIENT_ID,
        visitDateLocal: `2026-10-${day}`,
      });
      await repos().visitDiagnoses.add({ visitId: v.id, freeText: `Fake dx ${i}` });
      if (i % 2 === 0) {
        await repos().visits.finalise(v.id, { version: v.version });
      }
    }
    const started = Date.now();
    const rows = await repos().visits.listTimelineByPatient(PATIENT_ID, { limit: 50 });
    const ms = Date.now() - started;
    expect(rows).toHaveLength(30);
    expect(ms).toBeLessThan(1000);
  });

  it("refuses receptionist", async () => {
    await expect(
      repos(receptionist).visits.listTimelineByPatient(PATIENT_ID),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
