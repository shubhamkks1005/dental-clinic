import { orderDayQueue, type Timings } from "@clinic/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

// T1.4: a late arrival is marked "late" (position unchanged); a newcomer on a reordered day goes to the back.
const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const VISIT_ID = "01M83VTYPE01CONSULT000001";
const DAY = "2026-11-23";
const day = { open: true, start: "10:00", end: "19:00", lunchStart: null, lunchEnd: null };
const timings: Timings = {
  week: {
    mon: day,
    tue: day,
    wed: day,
    thu: day,
    fri: day,
    sat: day,
    sun: { ...day, open: false },
  },
  slotMinutes: 15,
  chairs: 1,
};
const NOW = new Date("2026-11-23T04:35:00.000Z"); // Monday 10:05 IST

let t: ReturnType<typeof testDb>;
const repos = () => createRepos(t.db, doctor);
const row = (id: string) =>
  t.sqlite.prepare("SELECT * FROM appointments WHERE id = ?").get(id) as Record<string, unknown>;

function appt(id: string, startMin: number, status = "scheduled") {
  const startAt = new Date(Date.UTC(2026, 10, 23, 0, 0) + (startMin - 330) * 60_000).toISOString();
  t.sqlite
    .prepare(
      `INSERT INTO appointments (
         id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
         start_at, date_local, start_min, end_min, status, source, priority, overbook
       ) VALUES (?, 's', 's', 'p1', '1', 'vt1', 'Consultation', ?, ?, ?, ?, ?, 'phone', 'normal', 0)`,
    )
    .run(id, startAt, DAY, startMin, startMin + 30, status);
}

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES ('p1', 's', 's', 'P-000001', 'Fake One', 'female', 30, '+919000000001', 'active')`,
    )
    .run();
  t.sqlite
    .prepare(
      `INSERT INTO users (id, email, name, role, created_by, updated_by) VALUES ('doc-a', 'd@example.test', 'Dr Fake', 'doctor', 's', 's')`,
    )
    .run();
});

describe("late mark on arrival", () => {
  it("arriving 25 minutes after the start time marks the row late", async () => {
    appt("late", 600); // 10:00 IST, now is 10:05; use a later "now" below
    const at = new Date("2026-11-23T04:55:00.000Z"); // 10:25 IST = 25 min late
    await repos().appointments.changeStatus(
      "late",
      { status: "arrived", version: 1, cancelReason: null },
      at,
    );
    expect(row("late").late_at).toBe(at.toISOString());
    expect(row("late").status).toBe("arrived");
  });

  it("arriving on time leaves it empty; exactly at the limit is not late", async () => {
    appt("ontime", 600);
    appt("edge", 600);
    await repos().appointments.changeStatus(
      "ontime",
      { status: "arrived", version: 1, cancelReason: null },
      NOW,
    );
    expect(row("ontime").late_at).toBeNull();
    const edge = new Date("2026-11-23T04:40:00.000Z"); // 10:10, exactly 10 minutes
    await repos().appointments.changeStatus(
      "edge",
      { status: "arrived", version: 1, cancelReason: null },
      edge,
    );
    expect(row("edge").late_at).toBeNull();
  });

  it("reads the limit from the setting", async () => {
    t.sqlite
      .prepare(`UPDATE settings SET value_json = '2' WHERE key = 'appointments.late_after_minutes'`)
      .run();
    appt("tight", 600);
    await repos().appointments.changeStatus(
      "tight",
      { status: "arrived", version: 1, cancelReason: null },
      NOW,
    );
    expect(row("tight").late_at).toBe(NOW.toISOString());
  });

  it("does not change the position of a late arrival", async () => {
    appt("a", 600);
    appt("b", 630);
    await repos().appointments.changeStatus(
      "a",
      { status: "arrived", version: 1, cancelReason: null },
      new Date("2026-11-23T05:30:00.000Z"),
    );
    expect(row("a").queue_order).toBeNull();
  });
});

describe("where a newcomer goes", () => {
  it("nobody reordered: queue_order stays empty (old arrival-time rule)", async () => {
    appt("a", 600);
    await repos().appointments.changeStatus(
      "a",
      { status: "arrived", version: 1, cancelReason: null },
      NOW,
    );
    expect(row("a").queue_order).toBeNull();
    const w = await repos().appointments.walkIn(
      { patientId: "p1", visitTypeId: VISIT_ID, priority: "normal", complaint: null },
      { timings, holidays: [], now: NOW },
    );
    expect(row(w.id).queue_order).toBeNull();
  });

  it("after a Skip a walk-in goes to the very back", async () => {
    appt("a", 600, "arrived");
    appt("b", 630);
    appt("c", 660);
    await repos().appointments.skip("a", 1, NOW);
    const before = Number(
      t.sqlite.prepare("SELECT max(queue_order) AS m FROM appointments").get()?.m,
    );
    const w = await repos().appointments.walkIn(
      { patientId: "p1", visitTypeId: VISIT_ID, priority: "normal", complaint: null },
      { timings, holidays: [], now: NOW },
    );
    expect(row(w.id).queue_order).toBe(before + 10);
    const rows = t.sqlite.prepare("SELECT * FROM appointments").all() as never[];
    const list = orderDayQueue(
      rows.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        status: r.status as never,
        queueOrder: r.queue_order as number | null,
        arrivedAt: r.arrived_at as string | null,
        startAt: r.start_at as string,
      })),
    );
    expect(list.at(-1)?.id).toBe(w.id);
  });

  it("after a Skip a row that arrives and had no number goes to the back; a numbered one keeps its place", async () => {
    appt("a", 600, "arrived");
    appt("b", 630);
    await repos().appointments.skip("a", 1, NOW);
    appt("late-booked", 540); // booked after the day was reordered: no number
    const bOrder = row("b").queue_order;
    const max = Number(t.sqlite.prepare("SELECT max(queue_order) AS m FROM appointments").get()?.m);
    await repos().appointments.changeStatus(
      "late-booked",
      { status: "arrived", version: 1, cancelReason: null },
      NOW,
    );
    expect(row("late-booked").queue_order).toBe(max + 10);
    await repos().appointments.changeStatus(
      "b",
      { status: "arrived", version: 2, cancelReason: null },
      NOW,
    );
    expect(row("b").queue_order).toBe(bOrder);
  });
});
