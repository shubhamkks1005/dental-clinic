import type { Timings } from "@clinic/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
let t: ReturnType<typeof testDb>;
const repos = () => createRepos(t.db, doctor);

const PATIENT_ID = "01M83PATIENTSLOTS01";
const VISIT_ID = "01M83VTYPE01CONSULT000001";

const open = (start: string, end: string) => ({
  open: true,
  start,
  end,
  lunchStart: null as string | null,
  lunchEnd: null as string | null,
});
const closed = { open: false, start: "10:00", end: "19:00", lunchStart: null, lunchEnd: null };

const timings: Timings = {
  week: {
    mon: open("10:00", "12:00"),
    tue: open("10:00", "12:00"),
    wed: open("10:00", "12:00"),
    thu: open("10:00", "12:00"),
    fri: open("10:00", "12:00"),
    sat: open("10:00", "12:00"),
    sun: closed,
  },
  slotMinutes: 15,
  chairs: 1,
};

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-007777', 'Fake Slots Patient', 'female', 25, '+919900003333', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("suggestSlots (2.4.2)", () => {
  it("returns up to five free slots after a busy booking", async () => {
    const now = new Date("2026-11-23T03:30:00.000Z");
    await repos().appointments.book(
      {
        patientId: PATIENT_ID,
        visitTypeId: VISIT_ID,
        dateLocal: "2026-11-23",
        startMin: 10 * 60,
        source: "phone",
        priority: "normal",
        complaint: null,
        overrideReason: null,
      },
      { timings, holidays: [], bookAheadDays: 90, now },
    );
    const slots = await repos().appointments.suggestSlots(VISIT_ID, {
      timings,
      holidays: [],
      now,
      fromDate: "2026-11-23",
      limit: 5,
    });
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.length).toBeLessThanOrEqual(5);
    expect(slots[0]?.startMin).toBeGreaterThanOrEqual(10 * 60 + 30);
  });
});
