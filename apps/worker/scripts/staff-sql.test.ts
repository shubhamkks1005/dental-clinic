import { newUlid } from "@clinic/shared";
import { migratedSqlite } from "@clinic/db/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { cleanEmail, recoverDoctorSql, seedDoctorSql } from "./staff-sql";

let sqlite: ReturnType<typeof migratedSqlite>;
const rows = (sql: string) => sqlite.prepare(sql).all();
const ids = () => ({ userId: newUlid(), auditId: newUlid(), accessId: newUlid() });

beforeEach(() => {
  sqlite = migratedSqlite();
});

describe("seed-doctor command SQL (1.3.3)", () => {
  it("adds the first doctor once, with an audit row and an access event", () => {
    sqlite.exec(seedDoctorSql({ ...ids(), email: " Doc@Example.com ", name: "Dr. Test O'Brien" }));
    expect(rows("SELECT email, name, role, status FROM users")).toEqual([
      { email: "doc@example.com", name: "Dr. Test O'Brien", role: "doctor", status: "active" },
    ]);
    expect(rows("SELECT action, table_name FROM audit_log")).toEqual([
      { action: "create", table_name: "users" },
    ]);
    expect(rows("SELECT action FROM access_log")).toEqual([{ action: "staff_change" }]);

    sqlite.exec(seedDoctorSql({ ...ids(), email: "second@example.com", name: "Dr. Second" }));
    expect(rows("SELECT email FROM users")).toEqual([{ email: "doc@example.com" }]);
    expect(rows("SELECT * FROM audit_log")).toHaveLength(1);
    expect(rows("SELECT * FROM access_log")).toHaveLength(1);
  });

  it("refuses bad emails, bad names and SQL tricks", () => {
    expect(() => cleanEmail("not an email")).toThrow();
    expect(() =>
      seedDoctorSql({ ...ids(), email: "x'; DROP TABLE users; --@a.com", name: "Dr. X" }),
    ).toThrow();
    expect(() =>
      seedDoctorSql({ ...ids(), email: "a@b.com", name: "Robert'); DROP TABLE users;--" }),
    ).toThrow();
    expect(() =>
      seedDoctorSql({ ...ids(), userId: "nope", email: "a@b.com", name: "Dr. X" }),
    ).toThrow();
  });
});

describe("recover-doctor command SQL (1.3.3)", () => {
  it("changes the email, clears the Google link, ends sessions, and audits it", () => {
    sqlite.exec(seedDoctorSql({ ...ids(), email: "old@example.com", name: "Dr. Test" }));
    const id = String(rows("SELECT id FROM users")[0]?.id);
    sqlite.exec(`UPDATE users SET google_sub = 'sub-1' WHERE id = '${id}'`);
    sqlite.exec(
      `INSERT INTO staff_sessions (id, user_id, token_hash, expires_at, last_seen_at, created_by, updated_by) VALUES ('s1', '${id}', 'h', '2099-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z', 'x', 'x')`,
    );
    const nowIso = new Date().toISOString();
    sqlite.exec(
      recoverDoctorSql({
        ...ids(),
        oldEmail: "old@example.com",
        newEmail: "New@Example.com",
        nowIso,
      }),
    );

    expect(rows("SELECT email, google_sub, version FROM users")).toEqual([
      { email: "new@example.com", google_sub: null, version: 2 },
    ]);
    expect(rows("SELECT revoked_at FROM staff_sessions")).toEqual([{ revoked_at: nowIso }]);
    expect(rows("SELECT action FROM audit_log ORDER BY action")).toEqual([
      { action: "create" },
      { action: "update" },
    ]);
    expect(rows("SELECT action FROM access_log")).toHaveLength(2);
  });

  it("does nothing (and audits nothing) when the old email is not the doctor's", () => {
    sqlite.exec(seedDoctorSql({ ...ids(), email: "doc@example.com", name: "Dr. Test" }));
    sqlite.exec(
      recoverDoctorSql({
        ...ids(),
        oldEmail: "wrong@example.com",
        newEmail: "new@example.com",
        nowIso: new Date().toISOString(),
      }),
    );
    expect(rows("SELECT email FROM users")).toEqual([{ email: "doc@example.com" }]);
    expect(rows("SELECT * FROM audit_log")).toHaveLength(1);
  });
});
