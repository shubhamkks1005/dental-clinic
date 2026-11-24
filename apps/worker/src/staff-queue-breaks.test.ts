import { istDate } from "@clinic/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { addStaff, makeEnv } from "./testing/app-env";
import { staffCall } from "./testing/staff-call";

// Part T routes: skip, pull forward, late, step out/back and the doctor's break.
let env: ReturnType<typeof makeEnv>["env"];
let sqlite: ReturnType<typeof makeEnv>["sqlite"];
const TODAY = istDate(new Date());

beforeEach(() => {
  ({ env, sqlite } = makeEnv());
  addStaff(sqlite, { id: "doc-a", email: "doc@example.test" });
  addStaff(sqlite, { id: "rec-1", email: "rec@example.test", role: "receptionist" });
  addStaff(sqlite, { id: "dev-1", email: "dev@example.test", role: "developer" });
  sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES ('p1', 's', 's', 'P-000001', 'Fake One', 'female', 30, '+919000000001', 'active')`,
    )
    .run();
  for (const [id, min, status] of [
    ["a", 600, "arrived"],
    ["b", 630, "scheduled"],
    ["c", 660, "scheduled"],
  ] as const) {
    sqlite
      .prepare(
        `INSERT INTO appointments (
           id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
           start_at, date_local, start_min, end_min, status, source, priority, overbook
         ) VALUES (?, 's', 's', 'p1', '1', 'vt1', 'Consultation', '2026-11-25T04:30:00.000Z', ?, ?, ?, ?, 'phone', 'normal', 0)`,
      )
      .run(id, TODAY, min, min + 30, status);
  }
});

const call = (email: string, method: "GET" | "POST", path: string, body?: unknown) =>
  staffCall(env, email, method, path, body);
const count = (table: string) =>
  Number(sqlite.prepare(`SELECT count(*) AS n FROM ${table}`).get()?.n);

describe("queue moves over HTTP", () => {
  it("the receptionist skips; the answer carries the swapped row; reload shows the new order", async () => {
    const r = await call("rec@example.test", "POST", "/appointments/a/skip", { version: 1 });
    expect(r.status).toBe(200);
    expect(r.json.data.move).toMatchObject({ id: "a", skipCount: 1, other: { id: "b" } });
    const orders = sqlite
      .prepare("SELECT id, queue_order FROM appointments ORDER BY queue_order")
      .all();
    expect(orders.map((o) => o.id)).toEqual(["b", "a", "c"]);
  });

  it("a stale version is 409 and nothing changes; a bad body is 400", async () => {
    expect(
      (await call("doc@example.test", "POST", "/appointments/a/skip", { version: 9 })).status,
    ).toBe(409);
    expect((await call("doc@example.test", "POST", "/appointments/a/skip", {})).status).toBe(400);
    expect(
      sqlite.prepare("SELECT queue_order FROM appointments WHERE id = 'a'").get()?.queue_order,
    ).toBeNull();
  });

  it("pull forward on the first row is 409; on the second it works", async () => {
    expect(
      (await call("doc@example.test", "POST", "/appointments/a/pull-forward", { version: 1 }))
        .status,
    ).toBe(409);
    expect(
      (await call("doc@example.test", "POST", "/appointments/b/pull-forward", { version: 1 }))
        .status,
    ).toBe(200);
  });

  it("late moves the same appointment to the back and the developer is refused", async () => {
    const r = await call("rec@example.test", "POST", "/appointments/a/late", { version: 1 });
    expect(r.status).toBe(200);
    expect(count("appointments")).toBe(3);
    expect(
      (await call("dev@example.test", "POST", "/appointments/b/late", { version: 1 })).status,
    ).toBe(403);
  });

  it("step out then back works", async () => {
    const out = await call("doc@example.test", "POST", "/appointments/b/step-out", { version: 1 });
    expect(out.status).toBe(200);
    const back = await call("doc@example.test", "POST", "/appointments/b/step-back", {
      version: out.json.data.move.version,
    });
    expect(back.status).toBe(200);
    expect(back.json.data.move.status).toBe("arrived");
  });

  it("no queue move touches bills, payments or messages", async () => {
    const before = ["bills", "payments", "message_outbox", "bill_items"].map(count);
    await call("rec@example.test", "POST", "/appointments/a/skip", { version: 1 });
    await call("rec@example.test", "POST", "/appointments/c/pull-forward", { version: 1 });
    await call("rec@example.test", "POST", "/appointments/b/late", { version: 3 });
    expect(["bills", "payments", "message_outbox", "bill_items"].map(count)).toEqual(before);
  });
});

describe("doctor break over HTTP", () => {
  it("with someone in the chair the start is 409 with the plain sentence", async () => {
    sqlite.prepare("UPDATE appointments SET status = 'in_chair' WHERE id = 'a'").run();
    const r = await call("doc@example.test", "POST", "/breaks", { minutes: 5 });
    expect(r.status).toBe(409);
    expect(r.json.error.message).toBe("Finish the visit in the chair first.");
  });

  it("start, read as the desk, +5, -5, refuse under 5, end, then no current break", async () => {
    const start = await call("doc@example.test", "POST", "/breaks", {
      minutes: 10,
      label: "Short breather",
    });
    expect(start.status).toBe(201);
    const id = start.json.data.current.id as string;
    expect((await call("rec@example.test", "GET", "/breaks/current")).json.data.current.id).toBe(
      id,
    );
    const plus = await call("doc@example.test", "POST", `/breaks/${id}/adjust`, {
      deltaMinutes: 5,
      version: 1,
    });
    expect(plus.json.data.current).toMatchObject({ minutes: 15, version: 2 });
    const minus = await call("doc@example.test", "POST", `/breaks/${id}/adjust`, {
      deltaMinutes: -5,
      version: 2,
    });
    expect(minus.json.data.current.minutes).toBe(10);
    const under = await call("doc@example.test", "POST", `/breaks/${id}/adjust`, {
      deltaMinutes: -10,
      version: 3,
    });
    expect(under.status).toBe(400);
    expect(
      (await call("doc@example.test", "POST", `/breaks/${id}/end`, { version: 3 })).status,
    ).toBe(200);
    expect((await call("doc@example.test", "GET", "/breaks/current")).json.data.current).toBeNull();
  });

  it("a break changes no appointment, bill, payment or message", async () => {
    const snap = () =>
      JSON.stringify(sqlite.prepare("SELECT * FROM appointments ORDER BY id").all());
    const before = snap();
    await call("doc@example.test", "POST", "/breaks", { minutes: 45, label: "Lunch break" });
    expect(snap()).toBe(before);
    expect(["bills", "payments", "message_outbox"].map(count)).toEqual([0, 0, 0]);
  });

  it("the receptionist and the developer cannot start a break; a bad length is 400", async () => {
    expect((await call("rec@example.test", "POST", "/breaks", { minutes: 5 })).status).toBe(403);
    expect((await call("dev@example.test", "POST", "/breaks", { minutes: 5 })).status).toBe(403);
    expect((await call("doc@example.test", "POST", "/breaks", { minutes: 7 })).status).toBe(400);
    expect((await call("dev@example.test", "GET", "/breaks/current")).status).toBe(403);
  });
});
