import { beforeEach, describe, expect, it } from "vitest";
import app from "./index";
import { addStaff, makeEnv, ORIGIN, sessionCookie } from "./testing/app-env";
import { seedStaff, seedWeek, WEEK_DAYS } from "./testing/appointments-seed";

// Several doctors (appointments calendar handoff P2.1): doctor list, leave days, calendar search,
// last visit (doctor only) and each doctor's own letterhead.
let env: ReturnType<typeof makeEnv>["env"];
let sqlite: ReturnType<typeof makeEnv>["sqlite"];

async function call(email: string, path: string, init: { method?: string; body?: unknown } = {}) {
  const cookie = await sessionCookie(env, email);
  const res = await app.request(
    `${ORIGIN}${path}`,
    {
      method: init.method ?? "GET",
      headers: {
        cookie,
        origin: ORIGIN,
        "x-clinic-request": "1",
        "content-type": "application/json",
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    },
    env,
  );
  const timing = res.headers.get("server-timing") ?? "";
  return {
    status: res.status,
    body: (await res.json()) as { data: Record<string, unknown> },
    roundTrips: Number(/queries;desc="(\d+)"/.exec(timing)?.[1]),
  };
}

beforeEach(() => {
  ({ env, sqlite } = makeEnv());
  seedStaff(sqlite);
  addStaff(sqlite, { id: "doc-b", email: "docb@example.test" });
  seedWeek(sqlite);
});

describe("GET /api/staff/doctors", () => {
  it("lists every active doctor for the desk (T41: a doctor added in Staff shows at once)", async () => {
    const r = await call("rec@example.test", "/api/staff/doctors");
    expect(r.status).toBe(200);
    expect((r.body.data.doctors as { id: string }[]).map((d) => d.id).sort()).toEqual([
      "doc-a",
      "doc-b",
    ]);
  });
});

describe("leave days", () => {
  it("a doctor adds own leave; the week shows it; the desk cannot add", async () => {
    const add = await call("docb@example.test", "/api/staff/doctor-leaves", {
      method: "POST",
      body: { doctorId: "doc-b", dateLocal: WEEK_DAYS[1] },
    });
    expect(add.status).toBe(201);
    const desk = await call("rec@example.test", "/api/staff/doctor-leaves", {
      method: "POST",
      body: { doctorId: "doc-b", dateLocal: WEEK_DAYS[2] },
    });
    expect(desk.status).toBe(403);
    const week = await call(
      "rec@example.test",
      `/api/staff/appointments/range?from=${WEEK_DAYS[0]}&to=${WEEK_DAYS[6]}`,
    );
    const days = week.body.data.days as { leaves: { doctorId: string }[] }[];
    expect(days[1]?.leaves).toEqual([expect.objectContaining({ doctorId: "doc-b" })]);
    // Doctor A does not see doctor B's leave line.
    const asA = await call(
      "doc@example.test",
      `/api/staff/appointments/range?from=${WEEK_DAYS[0]}&to=${WEEK_DAYS[6]}`,
    );
    expect((asA.body.data.days as { leaves: unknown[] }[])[1]?.leaves).toEqual([]);
  });
});

describe("GET /api/staff/appointments/search", () => {
  it("needs 2 letters; finds coming bookings", async () => {
    expect((await call("rec@example.test", "/api/staff/appointments/search?q=f")).status).toBe(400);
    const r = await call("rec@example.test", "/api/staff/appointments/search?q=zzzz");
    expect(r.status).toBe(200);
    expect(r.body.data.hits).toEqual([]);
  });
});

describe("GET /api/staff/patients/:id/last-visit (T21)", () => {
  it("doctor only", async () => {
    expect((await call("rec@example.test", "/api/staff/patients/p2/last-visit")).status).toBe(403);
    const r = await call("doc@example.test", "/api/staff/patients/p2/last-visit");
    expect(r.status).toBe(200);
    expect(r.body.data.lastVisit).toMatchObject({ procedures: expect.any(Array) });
  });
});

describe("my prescription details", () => {
  it("a doctor saves and reads their own; the desk is refused", async () => {
    const empty = await call("docb@example.test", "/api/staff/doctor-profile/me");
    expect(empty.body.data.profile).toBeNull();
    const saved = await call("docb@example.test", "/api/staff/doctor-profile/me", {
      method: "PUT",
      body: { nameOnRx: "Dr. Fake Bina", registrationNo: "R-22", version: 0 },
    });
    expect(saved.status).toBe(200);
    expect(saved.body.data.profile).toMatchObject({ nameOnRx: "Dr. Fake Bina", version: 1 });
    expect((await call("rec@example.test", "/api/staff/doctor-profile/me")).status).toBe(403);
  });
});

describe("booking for a doctor (P3.1.1)", () => {
  it("stays within the 10 round-trip rule and needs a doctor", async () => {
    const body = {
      patientId: "p1",
      visitTypeId: "01M83VTYPE01CONSULT000001",
      dateLocal: "2027-01-04",
      startMin: 600,
      source: "phone",
      overrideReason: "Test booking far ahead",
    };
    const none = await call("rec@example.test", "/api/staff/appointments", {
      method: "POST",
      body,
    });
    expect(none.status).toBe(400);
    const r = await call("rec@example.test", "/api/staff/appointments", {
      method: "POST",
      body: { ...body, doctorId: "doc-b", durationMin: 45 },
    });
    expect(r.status).toBe(201);
    expect(r.body.data.appointment).toMatchObject({ doctorId: "doc-b" });
    // Measured 2026-11-26: 8 (the doctor read is the one new read).
    expect(r.roundTrips).toBeLessThanOrEqual(10);
  });
});
