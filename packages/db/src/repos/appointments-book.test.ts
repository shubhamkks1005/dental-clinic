import type { Timings } from "@clinic/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ConflictError, ForbiddenError, InvalidError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";
import type { BookAppointmentOptions } from "./appointments-book";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };
const developer: Ctx = { userId: "dev-1", role: "developer", requestId: "r3" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

const PATIENT_ID = "01M83PATIENTBOOKTEST01";
const VISIT_ID = "01M83VTYPE01CONSULT000001"; // seeded Consultation 20 → 30 min at 15-slot

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

// Monday 23 Nov 2026 09:00 IST.
const nowMonMorning = new Date("2026-11-23T03:30:00.000Z");

const opts = (over: Partial<BookAppointmentOptions> = {}): BookAppointmentOptions => ({
  timings,
  holidays: [],
  bookAheadDays: 90,
  now: nowMonMorning,
  ...over,
});

beforeEach(() => {
  t = testDb();
  t.sqlite
    .prepare(
      `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
       VALUES (?, 'system', 'system', 'P-009999', 'Fake Book Patient', 'female', 30, '+919900001111', 'active')`,
    )
    .run(PATIENT_ID);
});

const bookBody = {
  patientId: PATIENT_ID,
  visitTypeId: VISIT_ID,
  dateLocal: "2026-11-23",
  startMin: 10 * 60,
  source: "phone" as const,
  priority: "normal" as const,
  complaint: null,
  overrideReason: null,
};

describe("book appointment overlap (2.3.4)", () => {
  it("books one slot and writes one audit row", async () => {
    const booked = await repos().appointments.book(bookBody, opts());
    expect(booked).toMatchObject({
      patientId: PATIENT_ID,
      visitTypeLabel: "Consultation",
      dateLocal: "2026-11-23",
      startMin: 600,
      endMin: 630,
      status: "scheduled",
      overbook: false,
    });
    expect(t.sqlite.prepare("SELECT COUNT(*) AS n FROM appointments").get()).toEqual({ n: 1 });
    expect(t.sqlite.prepare("SELECT COUNT(*) AS n FROM audit_log").get()).toEqual({ n: 1 });
  });

  it("50 parallel books on the same slot: one wins, losers write no audit", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 50 }, (_, i) =>
        repos({ ...receptionist, requestId: `race-${i}` }).appointments.book(bookBody, opts()),
      ),
    );
    const won = results.filter((r) => r.status === "fulfilled");
    const lost = results.filter((r) => r.status === "rejected");
    expect(won).toHaveLength(1);
    expect(lost).toHaveLength(49);
    for (const r of lost) {
      expect(r.status).toBe("rejected");
      if (r.status === "rejected") expect(r.reason).toBeInstanceOf(ConflictError);
    }
    expect(t.sqlite.prepare("SELECT COUNT(*) AS n FROM appointments").get()).toEqual({ n: 1 });
    expect(t.sqlite.prepare("SELECT COUNT(*) AS n FROM audit_log").get()).toEqual({ n: 1 });
  });

  it("overlapping later start is refused; adjacent end-to-start is allowed", async () => {
    await repos().appointments.book(bookBody, opts());
    await expect(
      repos().appointments.book({ ...bookBody, startMin: 10 * 60 + 15 }, opts()),
    ).rejects.toBeInstanceOf(ConflictError);
    const next = await repos().appointments.book({ ...bookBody, startMin: 10 * 60 + 30 }, opts());
    expect(next.startMin).toBe(630);
    expect(t.sqlite.prepare("SELECT COUNT(*) AS n FROM appointments").get()).toEqual({ n: 2 });
  });

  it("developer cannot book; receptionist can", async () => {
    await expect(repos(developer).appointments.book(bookBody, opts())).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(repos(receptionist).appointments.book(bookBody, opts())).resolves.toMatchObject({
      status: "scheduled",
    });
  });
});

describe("book appointment rules (2.3.5)", () => {
  it("refuses past, closed, lunch, and too-far-ahead without override", async () => {
    await expect(
      repos().appointments.book({ ...bookBody, startMin: 8 * 60 }, opts()),
    ).rejects.toBeInstanceOf(InvalidError);
    await expect(
      repos().appointments.book({ ...bookBody, dateLocal: "2026-11-22" }, opts()),
    ).rejects.toBeInstanceOf(InvalidError);
    await expect(
      repos().appointments.book({ ...bookBody, startMin: 13 * 60 + 15 }, opts({ holidays: [] })),
    ).rejects.toBeInstanceOf(InvalidError);
    await expect(
      repos().appointments.book({ ...bookBody, dateLocal: "2027-03-01" }, opts()),
    ).rejects.toBeInstanceOf(InvalidError);
  });

  it("override with reason sets overbook and audits the reason and rules", async () => {
    const booked = await repos().appointments.book(
      {
        ...bookBody,
        dateLocal: "2026-11-22",
        startMin: 10 * 60,
        overrideReason: "Family friend emergency",
      },
      opts(),
    );
    expect(booked.overbook).toBe(true);
    const audit = t.sqlite.prepare("SELECT after_json FROM audit_log").get() as {
      after_json: string;
    };
    const after = JSON.parse(audit.after_json) as {
      overbook: boolean;
      overrideReason: string;
      overrodeRules: string[];
    };
    expect(after.overbook).toBe(true);
    expect(after.overrideReason).toBe("Family friend emergency");
    expect(after.overrodeRules).toContain("closed");
  });
});
