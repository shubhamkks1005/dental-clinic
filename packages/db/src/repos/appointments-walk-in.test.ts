import { sortWaitingQueue, type Timings } from "@clinic/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };

let t: ReturnType<typeof testDb>;
const repos = () => createRepos(t.db, doctor);

const VISIT_ID = "01M83VTYPE01CONSULT000001";

const open = (start: string, end: string, lunch: [string, string] | null = ["13:30", "14:30"]) => ({
  open: true,
  start,
  end,
  lunchStart: lunch?.[0] ?? null,
  lunchEnd: lunch?.[1] ?? null,
});
const closed = { open: false, start: "10:00", end: "19:00", lunchStart: null, lunchEnd: null };

const timings: Timings = {
  week: {
    mon: open("10:00", "19:00"),
    tue: open("10:00", "19:00"),
    wed: open("10:00", "19:00"),
    thu: open("10:00", "19:00"),
    fri: open("10:00", "19:00"),
    sat: open("10:00", "19:00"),
    sun: closed,
  },
  slotMinutes: 15,
  chairs: 1,
};

// Monday 23 Nov 2026 10:05 IST.
const now = new Date("2026-11-23T04:35:00.000Z");

beforeEach(() => {
  t = testDb();
  for (const [id, code] of [
    ["p1", "P-000001"],
    ["p2", "P-000002"],
    ["p3", "P-000003"],
    ["p4", "P-000004"],
  ] as const) {
    t.sqlite
      .prepare(
        `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
         VALUES (?, 'system', 'system', ?, 'Fake Walk', 'female', 30, ?, 'active')`,
      )
      .run(id, code, `+91900000${code.slice(-4)}`);
  }
});

describe("walk-in and emergency (2.3.7)", () => {
  it("3 walk-ins then 1 emergency: queue lists emergency first", async () => {
    const opts = { timings, holidays: [] as [], now };
    const w1 = await repos().appointments.walkIn(
      { patientId: "p1", visitTypeId: VISIT_ID, priority: "normal", complaint: null },
      opts,
    );
    const w2 = await repos().appointments.walkIn(
      { patientId: "p2", visitTypeId: VISIT_ID, priority: "normal", complaint: null },
      { ...opts, now: new Date(now.getTime() + 60_000) },
    );
    const w3 = await repos().appointments.walkIn(
      { patientId: "p3", visitTypeId: VISIT_ID, priority: "normal", complaint: null },
      { ...opts, now: new Date(now.getTime() + 120_000) },
    );
    const em = await repos().appointments.walkIn(
      {
        patientId: "p4",
        visitTypeId: VISIT_ID,
        priority: "emergency",
        complaint: "Pain and swelling",
      },
      { ...opts, now: new Date(now.getTime() + 180_000) },
    );

    expect(w1.status).toBe("arrived");
    expect(em.priority).toBe("emergency");

    const rows = t.sqlite
      .prepare(
        `SELECT id, priority, arrived_at AS arrivedAt, created_at AS createdAt FROM appointments`,
      )
      .all() as {
      id: string;
      priority: "normal" | "emergency";
      arrivedAt: string;
      createdAt: string;
    }[];
    expect(sortWaitingQueue(rows).map((r) => r.id)).toEqual([em.id, w1.id, w2.id, w3.id]);
  });

  it("emergency can overbook when the day has no free slot", async () => {
    // Pack 10:00–19:00 minus lunch with busy rows so findFreeSlots is empty.
    t.sqlite
      .prepare(
        `INSERT INTO appointments (
           id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
           start_at, date_local, start_min, end_min, status, source, priority, overbook
         ) VALUES (
           'block', 'system', 'system', 'p1', '1', 'vt', 'Block',
           '2026-11-23T04:30:00.000Z', '2026-11-23', 600, 1140, 'scheduled', 'phone', 'normal', 0
         )`,
      )
      .run();
    const em = await repos().appointments.walkIn(
      {
        patientId: "p2",
        visitTypeId: VISIT_ID,
        priority: "emergency",
        complaint: "Bleeding",
      },
      { timings, holidays: [], now },
    );
    expect(em.overbook).toBe(true);
    expect(em.status).toBe("arrived");
  });
});
