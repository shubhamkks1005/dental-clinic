import type { Timings } from "@clinic/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { addFakeDoctor, testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
let t: ReturnType<typeof testDb>;
const repos = () => createRepos(t.db, doctor);

const PATIENT_ID = "01M83PATIENTDAYLIST01";
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

beforeEach(() => {
  t = testDb();
  addFakeDoctor(t.sqlite);
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-008888', 'Fake Day Patient', 'male', 28, '+919900002222', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("listForDay (2.4.1)", () => {
  it("returns appointments with patient name and code for that day", async () => {
    await repos().appointments.book(
      {
        patientId: PATIENT_ID,
        visitTypeId: VISIT_ID,
        doctorId: "doc-a",
        dateLocal: "2026-11-23",
        startMin: 11 * 60,
        source: "phone",
        priority: "normal",
        complaint: null,
        overrideReason: null,
      },
      { timings, holidays: [], bookAheadDays: 90, now: new Date("2026-11-23T03:30:00.000Z") },
    );
    const rows = await repos().appointments.listForDay("2026-11-23");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      patientCode: "P-008888",
      patientName: "Fake Day Patient",
      startMin: 11 * 60,
      visitTypeLabel: "Consultation",
    });
    expect(await repos().appointments.listForDay("2026-11-24")).toEqual([]);
  });
});
