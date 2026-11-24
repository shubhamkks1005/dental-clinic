import { addIstDays, istDate } from "@clinic/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { makeEnv } from "./testing/app-env";
import { addAppointment, getAs, seedStaff, seedWeek, WEEK_DAYS } from "./testing/appointments-seed";

let env: ReturnType<typeof makeEnv>["env"];
let sqlite: ReturnType<typeof makeEnv>["sqlite"];
const TODAY = istDate(new Date());
const FIRST = WEEK_DAYS[0]!;

beforeEach(() => {
  ({ env, sqlite } = makeEnv());
  seedStaff(sqlite);
  seedWeek(sqlite);
});

// T1.7: the day list also carries the doctor's order, its flags, the last order change and the break.
describe("day list: queue fields", () => {
  it("every row has queueOrder, steppedOutAt, skipCount, lateAt and queueChangedAt, and no user id", async () => {
    const r = await getAs(env, "doc@example.test", `/api/staff/appointments?date=${FIRST}`);
    const [one] = r.body.data.appointments;
    expect(one).toMatchObject({
      queueOrder: null,
      steppedOutAt: null,
      skipCount: 0,
      lateAt: null,
      queueChangedAt: null,
    });
    expect(one).not.toHaveProperty("queueChangedBy");
    expect(r.body.data.lastOrderChange).toBeNull();
    expect(r.body.data.currentBreak).toBeNull();
  });

  it("shows the saved order and who changed it last", async () => {
    sqlite
      .prepare(
        "UPDATE appointments SET queue_order = 20, skip_count = 1, stepped_out_at = '2026-12-07T05:00:00.000Z', queue_changed_at = '2026-12-07T05:18:00.000Z', queue_changed_by = 'rec-1' WHERE id = 'a-mon-1'",
      )
      .run();
    sqlite
      .prepare(
        "UPDATE appointments SET queue_order = 10, queue_changed_at = '2026-12-07T05:10:00.000Z', queue_changed_by = 'doc-a' WHERE id = 'a-mon-2'",
      )
      .run();
    for (const who of ["doc@example.test", "rec@example.test"]) {
      const r = await getAs(env, who, `/api/staff/appointments?date=${FIRST}`);
      const one = r.body.data.appointments.find((a) => a.id === "a-mon-1");
      expect(one).toMatchObject({ queueOrder: 20, skipCount: 1 });
      expect(r.body.data.lastOrderChange).toEqual({
        byName: "Test receptionist",
        at: "2026-12-07T05:18:00.000Z",
      });
    }
  });

  it("the break shows for today only, and not for another day", async () => {
    sqlite
      .prepare(
        "INSERT INTO doctor_breaks (id, created_by, updated_by, started_at, date_local, minutes, label) VALUES ('b1', 's', 's', ?, ?, 15, 'Coffee & reset')",
      )
      .run(new Date().toISOString(), TODAY);
    const today = await getAs(env, "rec@example.test", "/api/staff/appointments");
    expect(today.body.data.currentBreak).toMatchObject({
      id: "b1",
      minutes: 15,
      label: "Coffee & reset",
    });
    const other = await getAs(env, "rec@example.test", `/api/staff/appointments?date=${FIRST}`);
    expect(other.body.data.currentBreak).toBeNull();
  });

  it("query budget: a plain day, and today with a break and an order change, stay within 10 round trips", async () => {
    const plain = await getAs(env, "rec@example.test", `/api/staff/appointments?date=${FIRST}`);
    addAppointment(sqlite, { id: "a-today", patientId: "p1", dateLocal: TODAY, startMin: 600 });
    sqlite
      .prepare(
        "INSERT INTO doctor_breaks (id, created_by, updated_by, started_at, date_local, minutes, label) VALUES ('b1', 's', 's', ?, ?, 15, 'Break')",
      )
      .run(new Date().toISOString(), TODAY);
    sqlite
      .prepare(
        "UPDATE appointments SET queue_order = 10, queue_changed_at = ?, queue_changed_by = 'rec-1' WHERE id = 'a-today'",
      )
      .run(new Date().toISOString());
    const busiest = await getAs(env, "rec@example.test", "/api/staff/appointments");
    expect(busiest.body.data.lastOrderChange?.byName).toBe("Test receptionist");
    expect(busiest.body.data.currentBreak).not.toBeNull();
    // Server-Timing counts the session reads too. Measured 2026-11-25: before T1.7 a day list was 10; now a plain day is 9 (settings merged into one read) and the busiest case (today, with a break and an order change) is 10.
    expect(plain.roundTrips).toBeLessThanOrEqual(9);
    expect(busiest.roundTrips).toBeLessThanOrEqual(10);
  });

  it("a week range carries the break and the last change on today only", async () => {
    sqlite
      .prepare(
        "INSERT INTO doctor_breaks (id, created_by, updated_by, started_at, date_local, minutes, label) VALUES ('b1', 's', 's', ?, ?, 15, 'Break')",
      )
      .run(new Date().toISOString(), TODAY);
    addAppointment(sqlite, { id: "a-today", patientId: "p1", dateLocal: TODAY, startMin: 600 });
    sqlite
      .prepare(
        "UPDATE appointments SET queue_changed_at = ?, queue_changed_by = 'rec-1' WHERE id = 'a-today'",
      )
      .run(new Date().toISOString());
    const r = await getAs(
      env,
      "doc@example.test",
      `/api/staff/appointments/range?from=${TODAY}&to=${FIRST}`,
    );
    // from after to is refused, so ask today..today+1 explicitly.
    expect(r.status).toBe(400);
    const next = addIstDays(TODAY, 1);
    const week = await getAs(
      env,
      "doc@example.test",
      `/api/staff/appointments/range?from=${TODAY}&to=${next}`,
    );
    const [first, second] = week.body.data.days;
    expect(first?.currentBreak).toMatchObject({ id: "b1" });
    expect(first?.lastOrderChange?.byName).toBe("Test receptionist");
    expect(second?.currentBreak).toBeNull();
    expect(second?.lastOrderChange).toBeNull();
  });
});
