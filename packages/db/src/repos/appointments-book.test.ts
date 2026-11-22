import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ConflictError, ForbiddenError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "r1" };
const receptionist: Ctx = { userId: "rec-1", role: "receptionist", requestId: "r2" };
const developer: Ctx = { userId: "dev-1", role: "developer", requestId: "r3" };

let t: ReturnType<typeof testDb>;
const repos = (ctx: Ctx = doctor) => createRepos(t.db, ctx);

const PATIENT_ID = "01M83PATIENTBOOKTEST01";
const VISIT_ID = "01M83VTYPE01CONSULT000001"; // seeded Consultation 20 → 30 min at 15-slot

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
};

describe("book appointment overlap (2.3.4)", () => {
  it("books one slot and writes one audit row", async () => {
    const booked = await repos().appointments.book(bookBody, 15);
    expect(booked).toMatchObject({
      patientId: PATIENT_ID,
      visitTypeLabel: "Consultation",
      dateLocal: "2026-11-23",
      startMin: 600,
      endMin: 630,
      status: "scheduled",
    });
    expect(t.sqlite.prepare("SELECT COUNT(*) AS n FROM appointments").get()).toEqual({ n: 1 });
    expect(t.sqlite.prepare("SELECT COUNT(*) AS n FROM audit_log").get()).toEqual({ n: 1 });
  });

  it("50 parallel books on the same slot: one wins, losers write no audit", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 50 }, (_, i) =>
        repos({ ...receptionist, requestId: `race-${i}` }).appointments.book(bookBody, 15),
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
    await repos().appointments.book(bookBody, 15);
    await expect(
      repos().appointments.book({ ...bookBody, startMin: 10 * 60 + 15 }, 15),
    ).rejects.toBeInstanceOf(ConflictError);
    const next = await repos().appointments.book({ ...bookBody, startMin: 10 * 60 + 30 }, 15);
    expect(next.startMin).toBe(630);
    expect(t.sqlite.prepare("SELECT COUNT(*) AS n FROM appointments").get()).toEqual({ n: 2 });
  });

  it("developer cannot book; receptionist can", async () => {
    await expect(repos(developer).appointments.book(bookBody, 15)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(repos(receptionist).appointments.book(bookBody, 15)).resolves.toMatchObject({
      status: "scheduled",
    });
  });
});
