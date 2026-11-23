import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ForbiddenError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-a", role: "receptionist", requestId: "r2" };
const NOW = new Date("2026-11-23T06:30:00.000Z");

let t: ReturnType<typeof testDb>;

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES ('p1', 'system', 'system', 'P-000001', 'Fake Today', 'female', 30, '+919000000001', 'active')`,
    )
    .run();
  t.sqlite
    .prepare(
      `INSERT INTO appointments (
         id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
         start_at, date_local, start_min, end_min, status, source, priority, overbook
       ) VALUES
         ('a1', 'system', 'system', 'p1', '1', 'vt1', 'Consultation',
          '2026-11-23T04:30:00.000Z', '2026-11-23', 600, 630, 'arrived', 'phone', 'normal', 0),
         ('a2', 'system', 'system', 'p1', '1', 'vt1', 'Consultation',
          '2026-11-23T05:30:00.000Z', '2026-11-23', 660, 690, 'scheduled', 'phone', 'normal', 0)`,
    )
    .run();
  t.sqlite
    .prepare(
      `INSERT INTO payments (
         id, created_by, updated_by, patient_id, amount_paise, mode, received_at, received_by, day_local
       ) VALUES ('pay1', 'system', 'system', 'p1', 50000, 'cash', '2026-11-23T06:00:00.000Z', 'rec-a', '2026-11-23')`,
    )
    .run();
});

describe("today summary (6.3.8)", () => {
  it("gives arrived, remaining, collected for receptionist", async () => {
    const s = await createRepos(t.db, receptionist).todaySummary.get(NOW);
    expect(s.arrived).toBe(1);
    expect(s.remaining).toBe(2);
    expect(s.collectedPaise).toBe(50_000);
  });

  it("developer cannot read today summary", async () => {
    const developer: Ctx = { userId: "dev", role: "developer", requestId: "r3" };
    await expect(createRepos(t.db, developer).todaySummary.get(NOW)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("doctor can also read today summary", async () => {
    const s = await createRepos(t.db, doctor).todaySummary.get(NOW);
    expect(s.dateLocal).toBe("2026-11-23");
  });
});
