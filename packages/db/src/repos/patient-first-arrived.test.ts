import { isNewPatientOn } from "@clinic/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };

let t: ReturnType<typeof testDb>;
const repos = () => createRepos(t.db, doctor);

const START_AT = "2026-11-23T04:30:00.000Z"; // 10:00 IST

function insertPatient(id: string, code: string, legacyRef: string | null = null) {
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status, legacy_ref)
       VALUES (?, 'system', 'system', ?, 'Fake Arrive', 'female', 30, '+919000000001', 'active', ?)`,
    )
    .run(id, code, legacyRef);
}

function insertAppt(id: string, patientId: string, day: string, status = "scheduled") {
  t.sqlite
    .prepare(
      `INSERT INTO appointments (
         id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
         start_at, date_local, start_min, end_min, status, source, priority, overbook, version, updated_at
       ) VALUES (
         ?, 'system', 'system', ?, '1', 'vt1', 'Consultation',
         ?, ?, 600, 630, ?, 'phone', 'normal', 0, 1, ?
       )`,
    )
    .run(id, patientId, START_AT, day, status, START_AT);
}

beforeEach(() => {
  t = testDb();
});

describe("first_arrived_on (6.2.1)", () => {
  it("sets first_arrived_on on three fake patients when they first arrive", async () => {
    const now = new Date("2026-11-23T04:00:00.000Z");
    const days = ["2026-11-20", "2026-11-21", "2026-11-23"] as const;
    for (let i = 0; i < 3; i++) {
      const pid = `p${i + 1}`;
      insertPatient(pid, `P-00000${i + 1}`);
      insertAppt(`a${i + 1}`, pid, days[i]!);
      await repos().appointments.changeStatus(
        `a${i + 1}`,
        { status: "confirmed", version: 1, cancelReason: null },
        now,
      );
      await repos().appointments.changeStatus(
        `a${i + 1}`,
        { status: "arrived", version: 2, cancelReason: null },
        now,
      );
    }

    const rows = t.sqlite
      .prepare(
        `SELECT id, first_arrived_on AS firstArrivedOn FROM patients WHERE id IN ('p1','p2','p3') ORDER BY id`,
      )
      .all() as { id: string; firstArrivedOn: string }[];
    expect(rows).toEqual([
      { id: "p1", firstArrivedOn: "2026-11-20" },
      { id: "p2", firstArrivedOn: "2026-11-21" },
      { id: "p3", firstArrivedOn: "2026-11-23" },
    ]);
  });

  it("does not overwrite first_arrived_on on a later arrival", async () => {
    insertPatient("p1", "P-000001");
    insertAppt("a1", "p1", "2026-11-20");
    const now = new Date("2026-11-23T04:00:00.000Z");
    await repos().appointments.changeStatus(
      "a1",
      { status: "confirmed", version: 1, cancelReason: null },
      now,
    );
    await repos().appointments.changeStatus(
      "a1",
      { status: "arrived", version: 2, cancelReason: null },
      now,
    );
    insertAppt("a2", "p1", "2026-11-25");
    await repos().appointments.changeStatus(
      "a2",
      { status: "confirmed", version: 1, cancelReason: null },
      now,
    );
    await repos().appointments.changeStatus(
      "a2",
      { status: "arrived", version: 2, cancelReason: null },
      now,
    );
    const row = t.sqlite
      .prepare(`SELECT first_arrived_on AS d FROM patients WHERE id = 'p1'`)
      .get() as { d: string };
    expect(row.d).toBe("2026-11-20");
  });

  it("backfill sets first_arrived_on from existing arrived appointments", () => {
    // Migration already ran in testDb; simulate pre-column data by clearing then re-running backfill SQL.
    insertPatient("p-back", "P-000099");
    t.sqlite
      .prepare(
        `INSERT INTO appointments (
           id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
           start_at, date_local, start_min, end_min, status, source, priority, overbook,
           arrived_at, version, updated_at
         ) VALUES (
           'a-back', 'system', 'system', 'p-back', '1', 'vt1', 'Consultation',
           ?, '2026-10-01', 600, 630, 'completed', 'phone', 'normal', 0,
           ?, 1, ?
         )`,
      )
      .run(START_AT, START_AT, START_AT);

    t.sqlite.exec(`
      UPDATE patients
      SET first_arrived_on = (
        SELECT MIN(date_local) FROM appointments
        WHERE appointments.patient_id = patients.id
          AND appointments.deleted_at IS NULL
          AND (
            appointments.arrived_at IS NOT NULL
            OR appointments.status IN ('arrived', 'in_chair', 'completed')
          )
      )
      WHERE first_arrived_on IS NULL
        AND EXISTS (
          SELECT 1 FROM appointments
          WHERE appointments.patient_id = patients.id
            AND appointments.deleted_at IS NULL
            AND (
              appointments.arrived_at IS NOT NULL
              OR appointments.status IN ('arrived', 'in_chair', 'completed')
            )
        )
    `);

    const row = t.sqlite
      .prepare(`SELECT first_arrived_on AS d FROM patients WHERE id = 'p-back'`)
      .get() as { d: string };
    expect(row.d).toBe("2026-10-01");
  });

  it("legacy_ref patient is not counted as new even with first_arrived_on", () => {
    insertPatient("p-leg", "P-000088", "PAPER-7");
    t.sqlite
      .prepare(`UPDATE patients SET first_arrived_on = '2026-11-23' WHERE id = 'p-leg'`)
      .run();
    const row = t.sqlite
      .prepare(
        `SELECT first_arrived_on AS firstArrivedOn, legacy_ref AS legacyRef FROM patients WHERE id = 'p-leg'`,
      )
      .get() as { firstArrivedOn: string; legacyRef: string };
    expect(isNewPatientOn(row, "2026-11-23")).toBe(false);
  });
});
