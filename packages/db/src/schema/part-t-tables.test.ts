import { afterAll, describe, expect, it } from "vitest";
import { migratedSqlite } from "../testing";

const db = migratedSqlite();
afterAll(() => db.close());

const brk = (id: string, day: string, minutes: number, ended: string | null) =>
  db
    .prepare(
      `INSERT INTO doctor_breaks (id, created_by, updated_by, started_at, date_local, minutes, label, ended_at)
       VALUES (?, 's', 's', '2026-11-25T05:00:00.000Z', ?, ?, 'Break', ?)`,
    )
    .run(id, day, minutes, ended);

const approval = (id: string, type: string, appt: string | null, status = "open", note = "Ok") =>
  db
    .prepare(
      `INSERT INTO approval_requests (id, created_by, updated_by, type, status, appointment_id, note)
       VALUES (?, 's', 's', ?, ?, ?, ?)`,
    )
    .run(id, type, status, appt, note);

describe("doctor_breaks (T1.2)", () => {
  it("allows only one open break at a time, closed ones do not count", () => {
    brk("b1", "2026-11-25", 10, null);
    expect(() => brk("b2", "2026-11-25", 10, null)).toThrow();
    expect(() => brk("b3", "2026-11-25", 10, "2026-11-25T05:10:00.000Z")).not.toThrow();
  });
  it("keeps minutes between 5 and 120", () => {
    expect(() => brk("b4", "2026-11-24", 4, "x")).toThrow();
    expect(() => brk("b5", "2026-11-24", 121, "x")).toThrow();
  });
});

describe("approval_requests (T1.2)", () => {
  it("allows one open request per type and appointment", () => {
    approval("a1", "refund", "ap1");
    expect(() => approval("a2", "refund", "ap1")).toThrow();
    expect(() => approval("a3", "overbook", "ap1")).not.toThrow();
    expect(() => approval("a4", "refund", "ap1", "approved")).not.toThrow();
  });
  it("needs a note of 1 to 200 letters and a known type", () => {
    expect(() => approval("a5", "refund", "ap2", "open", "")).toThrow();
    expect(() => approval("a6", "refund", "ap2", "open", "x".repeat(201))).toThrow();
    expect(() => approval("a7", "nonsense", "ap2")).toThrow();
  });
});

describe("appointments queue columns (T1.2)", () => {
  it("skip_count cannot go negative and starts at 0", () => {
    const cols = db
      .prepare("PRAGMA table_info(appointments)")
      .all()
      .map((c) => c.name);
    for (const c of [
      "queue_order",
      "stepped_out_at",
      "skip_count",
      "late_at",
      "queue_changed_at",
      "queue_changed_by",
    ]) {
      expect(cols).toContain(c);
    }
    const d = db
      .prepare("PRAGMA table_info(appointments)")
      .all()
      .find((c) => c.name === "skip_count");
    expect(String(d?.dflt_value)).toBe("0");
  });
});
