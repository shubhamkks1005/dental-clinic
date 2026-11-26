import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { DB_MIGRATIONS } from "../testing/paths";

// 0066 on a database that already has data (owner Q2: old bookings are demo data and go to the
// first active doctor; the first doctor keeps today's letterhead lines). Fake data only.
describe("0066 several doctors on an existing database", () => {
  it("backfills bookings, breaks and requests and copies the letterhead to the first doctor", () => {
    const db = new DatabaseSync(":memory:");
    const files = readdirSync(DB_MIGRATIONS)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const f of files.filter((f) => f < "0066")) {
      db.exec(readFileSync(`${DB_MIGRATIONS}${f}`, "utf8"));
    }
    const user = db.prepare(
      `INSERT INTO users (id, created_by, updated_by, created_at, email, name, role, status)
       VALUES (?, 's', 's', ?, ?, ?, ?, ?)`,
    );
    user.run(
      "rec",
      "2025-01-01T00:00:00Z",
      "rec@example.test",
      "Fake Desk",
      "receptionist",
      "active",
    );
    user.run("old", "2025-02-01T00:00:00Z", "old@example.test", "Fake Gone", "doctor", "disabled");
    user.run("first", "2025-03-01T00:00:00Z", "a@example.test", "Fake First", "doctor", "active");
    user.run("second", "2025-04-01T00:00:00Z", "b@example.test", "Fake Second", "doctor", "active");
    db.prepare(
      `UPDATE settings SET value_json = '"Dr. Fake First"' WHERE key = 'doctor.name'`,
    ).run();
    db.prepare(
      `INSERT INTO appointments (
         id, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label,
         start_at, date_local, start_min, end_min, status, source, priority, overbook
       ) VALUES ('ap1', 's', 's', 'p', '1', 'vt', 'Consultation', '2026-11-20T05:00:00.000Z',
         '2026-11-20', 600, 630, 'scheduled', 'phone', 'normal', 0)`,
    ).run();
    db.prepare(
      `INSERT INTO doctor_breaks (id, created_by, updated_by, started_at, date_local, minutes, label)
       VALUES ('b1', 'first', 'first', '2026-11-20T05:00:00.000Z', '2026-11-20', 10, 'Break')`,
    ).run();
    db.prepare(
      `INSERT INTO approval_requests (id, created_by, updated_by, type, appointment_id, note)
       VALUES ('r1', 'rec', 'rec', 'refund', 'ap1', 'Refund?')`,
    ).run();

    db.exec(readFileSync(`${DB_MIGRATIONS}${files.find((f) => f.startsWith("0066"))}`, "utf8"));

    const one = (q: string) => db.prepare(q).get() as Record<string, unknown>;
    expect(one("SELECT doctor_id, chair_id FROM appointments WHERE id = 'ap1'")).toEqual({
      doctor_id: "first",
      chair_id: "1",
    });
    expect(one("SELECT doctor_id FROM doctor_breaks WHERE id = 'b1'")).toEqual({
      doctor_id: "first",
    });
    expect(one("SELECT doctor_id FROM approval_requests WHERE id = 'r1'")).toEqual({
      doctor_id: "first",
    });
    expect(one("SELECT user_id, name_on_rx FROM doctor_profiles")).toEqual({
      user_id: "first",
      name_on_rx: "Dr. Fake First",
    });
    expect(one("SELECT COUNT(*) AS n FROM doctor_profiles")).toEqual({ n: 1 });
    db.close();
  });
});
