import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError, InvalidError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

const PATIENT_ID = "01M83PATIENTTOOTHTEST01";

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009903', 'Fake Tooth Patient', 'female', 30, '+919900001222', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("tooth events (3.2.2)", () => {
  it("appends events and builds chart from the latest per surface", async () => {
    await repos().toothEvents.add({
      patientId: PATIENT_ID,
      toothFdi: 46,
      surface: "o",
      conditionCode: "caries",
      notedAt: "2026-01-01T00:00:00.000Z",
    });
    await repos().toothEvents.add({
      patientId: PATIENT_ID,
      toothFdi: 46,
      surface: "o",
      conditionCode: "filling",
      notedAt: "2026-06-01T00:00:00.000Z",
    });
    const chart = await repos().toothEvents.chartForPatient(PATIENT_ID);
    expect(chart.rowsRead).toBe(2);
    expect(chart.cells).toEqual([
      expect.objectContaining({ toothFdi: 46, surface: "o", conditionCode: "filling" }),
    ]);
  });

  it("builds a chart for a heavy history in under 400 rows read", async () => {
    const surfaces = ["m", "d", "o", "b", "l"] as const;
    let n = 0;
    for (let year = 2016; year <= 2026; year++) {
      for (const tooth of [16, 26, 36, 46, 11, 21]) {
        for (const surface of surfaces) {
          n += 1;
          await repos().toothEvents.add({
            patientId: PATIENT_ID,
            toothFdi: tooth,
            surface,
            conditionCode: n % 2 === 0 ? "caries" : "filling",
            notedAt: `${year}-06-15T10:00:00.000Z`,
          });
        }
      }
    }
    expect(n).toBeLessThan(400);
    const chart = await repos().toothEvents.chartForPatient(PATIENT_ID);
    expect(chart.rowsRead).toBe(n);
    expect(chart.rowsRead).toBeLessThan(400);
    expect(chart.cells.length).toBeLessThanOrEqual(6 * 5);
  });

  it("rejects bad FDI and receptionist chart writes", async () => {
    await expect(
      repos().toothEvents.add({
        patientId: PATIENT_ID,
        toothFdi: 99,
        surface: "o",
        conditionCode: "caries",
      }),
    ).rejects.toBeInstanceOf(InvalidError);
    await expect(
      repos(receptionist).toothEvents.add({
        patientId: PATIENT_ID,
        toothFdi: 46,
        surface: "o",
        conditionCode: "caries",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      repos(receptionist).toothEvents.chartForPatient(PATIENT_ID),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
