import type { Timings } from "@clinic/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
let t: ReturnType<typeof testDb>;
const repos = () => createRepos(t.db, doctor);

const VISIT_ID = "01M83VTYPE01CONSULT000001";
const PATIENT_ID = "01M83PATIENTRESCHED0001";

const open = (start: string, end: string) => ({
  open: true,
  start,
  end,
  lunchStart: "13:30",
  lunchEnd: "14:30",
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

const now = new Date("2026-11-23T03:30:00.000Z");
const opts = { timings, holidays: [] as [], bookAheadDays: 90, now };

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009901', 'Fake Reschedule', 'female', 30, '+919900009901', 'active')`,
    )
    .run(PATIENT_ID);
});

describe("reschedule and cancel (2.3.8)", () => {
  it("reschedule keeps the old row and builds a chain; cancel stores reason", async () => {
    const first = await repos().appointments.book(
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
      opts,
    );
    const moved = await repos().appointments.reschedule(
      first.id,
      {
        version: first.version,
        dateLocal: "2026-11-24",
        startMin: 11 * 60,
        overrideReason: null,
      },
      opts,
    );
    expect(moved.previous.status).toBe("rescheduled");
    expect(moved.appointment.rescheduledFrom).toBe(first.id);
    expect(t.sqlite.prepare("SELECT COUNT(*) AS n FROM appointments").get()).toEqual({ n: 2 });

    const chain = await repos().appointments.rescheduleChain(moved.appointment.id);
    expect(chain.map((r) => r.id)).toEqual([first.id, moved.appointment.id]);
    expect(chain[0]!.status).toBe("rescheduled");
    expect(chain[1]!.status).toBe("scheduled");

    const cancelled = await repos().appointments.cancel(moved.appointment.id, {
      version: moved.appointment.version,
      reason: "patient_request",
      detail: null,
      notifyPatient: true,
    });
    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.cancelReason).toBe("Patient asked to cancel");
    const audit = t.sqlite
      .prepare(`SELECT after_json FROM audit_log WHERE row_id = ? ORDER BY created_at DESC LIMIT 1`)
      .get(moved.appointment.id) as { after_json: string };
    expect(JSON.parse(audit.after_json)).toMatchObject({ notifyPatient: true });
  });

  it("lists patient appointments without deleting any row", async () => {
    const a = await repos().appointments.book(
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
      opts,
    );
    await repos().appointments.cancel(a.id, {
      version: a.version,
      reason: "other",
      detail: "Double booked by mistake",
      notifyPatient: false,
    });
    const list = await repos().appointments.listForPatient(PATIENT_ID);
    expect(list).toHaveLength(1);
    expect(list[0]!.status).toBe("cancelled");
  });
});
