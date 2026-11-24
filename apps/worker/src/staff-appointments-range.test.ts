import { beforeEach, describe, expect, it } from "vitest";
import { addAppointment, getAs, seedStaff, seedWeek, WEEK_DAYS } from "./testing/appointments-seed";
import { makeEnv } from "./testing/app-env";

let env: ReturnType<typeof makeEnv>["env"];
let sqlite: ReturnType<typeof makeEnv>["sqlite"];

beforeEach(() => {
  ({ env, sqlite } = makeEnv());
  seedStaff(sqlite);
  seedWeek(sqlite);
});

const range = (from: string, to: string) => `/api/staff/appointments/range?from=${from}&to=${to}`;
const FIRST = WEEK_DAYS[0]!;
const LAST = WEEK_DAYS[6]!;

// S3.2.2: the week in one request, every day shaped like GET /appointments?date=.
describe("GET /api/staff/appointments/range", () => {
  it("returns 7 days in order, each with the day-view shape, and leaves out other days", async () => {
    const r = await getAs(env, "rec@example.test", range(FIRST, LAST));
    expect(r.status).toBe(200);
    const days = r.body.data.days as { dateLocal: string; appointments: { id: string }[] }[];
    expect(days.map((d) => d.dateLocal)).toEqual(WEEK_DAYS);
    for (const d of days) {
      expect(Object.keys(d).sort()).toEqual([
        "appointments",
        "currentBreak",
        "dateLocal",
        "lastOrderChange",
        "serverNow",
        "window",
      ]);
    }
    expect(days.map((d) => d.appointments.map((a) => a.id))).toEqual([
      ["a-mon-1", "a-mon-2"],
      [],
      ["a-wed-1"],
      [],
      [],
      [],
      ["a-sun-1"],
    ]);
  });

  it("each day equals what the day endpoint says (same marks, same window)", async () => {
    const week = await getAs(env, "rec@example.test", range(FIRST, LAST));
    for (const d of week.body.data.days as { dateLocal: string; serverNow: string }[]) {
      const day = await getAs(
        env,
        "rec@example.test",
        `/api/staff/appointments?date=${d.dateLocal}`,
      );
      expect({ ...d, serverNow: "x" }).toEqual({ ...day.body.data, serverNow: "x" });
    }
  });

  it("receptionist gets the due amount; doctor gets only the mark", async () => {
    const rec = await getAs(env, "rec@example.test", range(FIRST, FIRST));
    const doc = await getAs(env, "doc@example.test", range(FIRST, FIRST));
    expect(rec.body.data.days[0]?.appointments[0]).toMatchObject({ hasDue: true, duePaise: 50000 });
    expect(rec.body.data.days[0]?.appointments[1]?.readyToBill).toEqual({ billId: null });
    expect(doc.body.data.days[0]?.appointments[0]).toMatchObject({ hasDue: true, duePaise: null });
    expect(doc.body.data.days[0]?.appointments[1]?.readyToBill).toBeNull();
  });

  it("developer is refused with 403", async () => {
    expect((await getAs(env, "dev@example.test", range(FIRST, LAST))).status).toBe(403);
  });

  it("8 days is 400 with a plain sentence", async () => {
    const r = await getAs(env, "rec@example.test", range(FIRST, "2026-12-14"));
    expect(r.status).toBe(400);
    expect(r.body.error?.message).toBe("Pick at most 7 days at a time.");
  });

  it("bad, missing, reversed or impossible dates are 400", async () => {
    for (const path of [
      "/api/staff/appointments/range",
      range("nope", LAST),
      range(FIRST, ""),
      range(LAST, FIRST),
      range("2026-02-30", "2026-03-01"),
    ]) {
      const r = await getAs(env, "rec@example.test", path);
      expect(r.status, path).toBe(400);
      expect(r.body.error?.message, path).toMatch(/^(Pick|The end)/);
    }
  });

  it("a one-day range works", async () => {
    const r = await getAs(env, "rec@example.test", range(FIRST, FIRST));
    expect(r.body.data.days).toHaveLength(1);
  });

  it("with more than 90 patients and appointments it still answers and marks everyone", async () => {
    for (let i = 0; i < 100; i++) {
      const id = `bulk-${i}`;
      sqlite
        .prepare(
          `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
           VALUES (?, 'system', 'system', ?, ?, 'female', 30, ?, 'active')`,
        )
        .run(
          id,
          `P-9${String(i).padStart(5, "0")}`,
          `Fake Bulk ${i}`,
          `+9180000${String(i).padStart(5, "0")}`,
        );
      addAppointment(sqlite, {
        id: `appt-${id}`,
        patientId: id,
        dateLocal: WEEK_DAYS[1]!,
        startMin: 540 + (i % 20) * 30,
      });
      sqlite
        .prepare(
          `INSERT INTO visits (id, created_by, updated_by, patient_id, appointment_id, doctor_id, visit_date_local, status)
           VALUES (?, 'system', 'system', ?, ?, 'doc-a', ?, 'final')`,
        )
        .run(`visit-${id}`, id, `appt-${id}`, WEEK_DAYS[1]);
    }
    sqlite.prepare("UPDATE alerts SET patient_id = 'bulk-99' WHERE id = 'al-1'").run();
    const r = await getAs(env, "rec@example.test", range(FIRST, LAST));
    expect(r.status).toBe(200);
    const tuesday = r.body.data.days[1]?.appointments as {
      patientId: string;
      readyToBill: unknown;
      alertFlags: { hasAlert: boolean };
    }[];
    expect(tuesday).toHaveLength(100);
    expect(tuesday.every((a) => a.readyToBill !== null)).toBe(true);
    expect(tuesday.filter((a) => a.alertFlags.hasAlert).map((a) => a.patientId)).toEqual([
      "bulk-99",
    ]);
  });

  it("uses fewer round trips than seven day requests", async () => {
    const week = await getAs(env, "rec@example.test", range(FIRST, LAST));
    const one = await getAs(env, "rec@example.test", `/api/staff/appointments?date=${FIRST}`);
    expect(week.roundTrips).toBeLessThan(one.roundTrips * 7);
    expect(week.roundTrips).toBeLessThanOrEqual(10);
  });
});
