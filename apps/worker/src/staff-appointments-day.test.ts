import { beforeEach, describe, expect, it } from "vitest";
import { getAs, seedStaff, seedWeek, WEEK_DAYS } from "./testing/appointments-seed";
import { makeEnv } from "./testing/app-env";

let env: ReturnType<typeof makeEnv>["env"];
let sqlite: ReturnType<typeof makeEnv>["sqlite"];

beforeEach(() => {
  ({ env, sqlite } = makeEnv());
  seedStaff(sqlite);
  seedWeek(sqlite);
});

// S3.2.1: the day list keeps its reply; only the order of the reads changed.
describe("GET /api/staff/appointments?date= (day list)", () => {
  it("receptionist sees the due amount, the ready-to-bill mark and the alert flag", async () => {
    const r = await getAs(env, "rec@example.test", `/api/staff/appointments?date=${WEEK_DAYS[0]}`);
    expect(r.status).toBe(200);
    expect(r.body.data.dateLocal).toBe(WEEK_DAYS[0]);
    expect(Object.keys(r.body.data).sort()).toEqual([
      "appointments",
      "dateLocal",
      "serverNow",
      "window",
    ]);
    const [one, two] = r.body.data.appointments;
    expect(one).toMatchObject({
      id: "a-mon-1",
      hasDue: true,
      duePaise: 50000,
      readyToBill: null,
      alertFlags: { hasAlert: true, hasRestricted: true },
    });
    expect(two).toMatchObject({
      id: "a-mon-2",
      hasDue: false,
      duePaise: null,
      readyToBill: { billId: null },
      alertFlags: { hasAlert: false, hasRestricted: false },
    });
  });

  it("doctor sees only the due mark: no amount, no ready-to-bill, no error", async () => {
    const r = await getAs(env, "doc@example.test", `/api/staff/appointments?date=${WEEK_DAYS[0]}`);
    expect(r.status).toBe(200);
    const [one, two] = r.body.data.appointments;
    expect(one).toMatchObject({ hasDue: true, duePaise: null, readyToBill: null });
    expect(two?.readyToBill).toBeNull();
    expect(one?.alertFlags.hasAlert).toBe(true);
  });

  it("developer is refused and a bad date is 400", async () => {
    expect(
      (await getAs(env, "dev@example.test", "/api/staff/appointments?date=2026-12-07")).status,
    ).toBe(403);
    expect((await getAs(env, "rec@example.test", "/api/staff/appointments?date=nope")).status).toBe(
      400,
    );
  });

  it("is still a handful of round trips", async () => {
    const r = await getAs(env, "rec@example.test", `/api/staff/appointments?date=${WEEK_DAYS[0]}`);
    // Before S3.2.1 this was 10 (counted by Server-Timing, session reads included).
    expect(r.roundTrips).toBeLessThanOrEqual(10);
  });
});
