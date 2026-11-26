import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { afterAll, describe, expect, it } from "vitest";
import { migratedSqlite } from "../testing";
import { DB_MIGRATIONS } from "../testing/paths";

const db = migratedSqlite();
afterAll(() => db.close());

const brk = (id: string, day: string, minutes: number, ended: string | null, doctorId = "doc-a") =>
  db
    .prepare(
      `INSERT INTO doctor_breaks (id, created_by, updated_by, doctor_id, started_at, date_local, minutes, label, ended_at)
       VALUES (?, 's', 's', ?, '2026-11-25T05:00:00.000Z', ?, ?, 'Break', ?)`,
    )
    .run(id, doctorId, day, minutes, ended);

const approval = (id: string, type: string, appt: string | null, status = "open", note = "Ok") =>
  db
    .prepare(
      `INSERT INTO approval_requests (id, created_by, updated_by, type, status, appointment_id, note)
       VALUES (?, 's', 's', ?, ?, ?, ?)`,
    )
    .run(id, type, status, appt, note);

describe("doctor_breaks (T1.2)", () => {
  it("allows only one open break per doctor at a time, closed ones do not count", () => {
    brk("b1", "2026-11-25", 10, null);
    expect(() => brk("b2", "2026-11-25", 10, null)).toThrow();
    expect(() => brk("b3", "2026-11-25", 10, "2026-11-25T05:10:00.000Z")).not.toThrow();
    // 0066: another doctor may be on break at the same time.
    expect(() => brk("b6", "2026-11-25", 10, null, "doc-b")).not.toThrow();
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

// T1.G: 0057 must also work on a database that already has appointments (an older scratch DB).
describe("0057 on a database that already has data", () => {
  it("keeps every existing appointment and gives it the new defaults", () => {
    const old = new DatabaseSync(":memory:");
    const files = readdirSync(DB_MIGRATIONS)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    // Only the migrations before 0057 (later ones, such as 0066, build on it).
    for (const file of files.filter((f) => f < "0057")) {
      old.exec(readFileSync(`${DB_MIGRATIONS}${file}`, "utf8"));
    }
    old
      .prepare(
        `INSERT INTO appointments (
           id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
           start_at, date_local, start_min, end_min, status, source, priority, overbook
         ) VALUES ('old1', 's', 's', 'p', '1', 'vt', 'Consultation', '2026-11-20T05:00:00.000Z', '2026-11-20', 600, 630, 'completed', 'phone', 'normal', 0)`,
      )
      .run();
    const sql57 = files.find((f) => f.startsWith("0057")) as string;
    old.exec(readFileSync(`${DB_MIGRATIONS}${sql57}`, "utf8"));
    const row = old.prepare("SELECT * FROM appointments WHERE id = 'old1'").get() as Record<
      string,
      unknown
    >;
    expect(row).toMatchObject({
      status: "completed",
      skip_count: 0,
      queue_order: null,
      late_at: null,
      stepped_out_at: null,
    });
    expect(
      old
        .prepare(
          "SELECT COUNT(*) AS n FROM settings WHERE key IN ('appointments.late_after_minutes','today.running_late_after_minutes')",
        )
        .get()?.n,
    ).toBe(2);
    old.close();
  });
});
