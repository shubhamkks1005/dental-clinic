import type { Timings } from "@clinic/shared";
import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ConflictError, ForbiddenError, InvalidError } from "../errors";
import { addFakeDoctor, addFakeLeave, testDb } from "../testing";
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
  addFakeDoctor(t.sqlite);
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
  doctorId: "doc-a",
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

  it("clashes are allowed (owner 2026-11-26): overlap books; only an exact repeat is refused", async () => {
    await repos().appointments.book(bookBody, opts());
    const overlap = await repos().appointments.book(
      { ...bookBody, startMin: 10 * 60 + 15 },
      opts(),
    );
    expect(overlap.startMin).toBe(615);
    await expect(repos().appointments.book(bookBody, opts())).rejects.toThrow(
      "This patient is already booked at that time.",
    );
    t.sqlite
      .prepare(
        `INSERT INTO patients (id, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
         VALUES ('p-two', 'system', 'system', 'P-009998', 'Fake Second', 'male', 40, '+919900001112', 'active')`,
      )
      .run();
    await repos().appointments.book({ ...bookBody, patientId: "p-two" }, opts());
    expect(t.sqlite.prepare("SELECT COUNT(*) AS n FROM appointments").get()).toEqual({ n: 3 });
  });

  it("stores the doctor and the doctor's own chair", async () => {
    const booked = await repos().appointments.book(bookBody, opts());
    expect(booked.doctorId).toBe("doc-a");
    expect(
      t.sqlite.prepare("SELECT doctor_id, chair_id FROM appointments WHERE id = ?").get(booked.id),
    ).toEqual({ doctor_id: "doc-a", chair_id: "doc:doc-a" });
  });

  it("any length: durationMin overrides the visit type's 30 minutes", async () => {
    const booked = await repos().appointments.book({ ...bookBody, durationMin: 75 }, opts());
    expect(booked.endMin).toBe(600 + 75);
    const plain = await repos().appointments.book({ ...bookBody, startMin: 12 * 60 }, opts());
    expect(plain.endMin - plain.startMin).toBe(30);
  });

  it("a doctor books only for themself; the desk books for any active doctor (owner Q3)", async () => {
    addFakeDoctor(t.sqlite, "doc-b", "Dr. Fake Bina", "2026-02-01T00:00:00.000Z");
    await expect(
      repos().appointments.book({ ...bookBody, doctorId: "doc-b" }, opts()),
    ).rejects.toThrow("You can book only for yourself.");
    const forB = await repos(receptionist).appointments.book(
      { ...bookBody, doctorId: "doc-b" },
      opts(),
    );
    expect(forB.doctorId).toBe("doc-b");
    await expect(
      repos(receptionist).appointments.book({ ...bookBody, doctorId: "nobody" }, opts()),
    ).rejects.toThrow("That doctor was not found");
  });

  it("the doctor's leave day is a soft rule (override books it)", async () => {
    addFakeLeave(t.sqlite, "doc-a", "2026-11-24");
    const tue = { ...bookBody, dateLocal: "2026-11-24" };
    await expect(repos().appointments.book(tue, opts())).rejects.toThrow(
      "Dr. Fake Asha is on leave that day.",
    );
    const booked = await repos().appointments.book(
      { ...tue, overrideReason: "Doctor agreed" },
      opts(),
    );
    expect(booked.overbook).toBe(true);
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
