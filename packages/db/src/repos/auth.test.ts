import { beforeEach, describe, expect, it } from "vitest";
import { testDb } from "../testing";
import { authRepo, type StaffUser } from "./auth";

let t: ReturnType<typeof testDb>;
const rows = (sqlText: string) => t.sqlite.prepare(sqlText).all();
const repo = () => authRepo(t.db);

function addUser(id: string, email: string, status = "active", sub: string | null = null) {
  t.sqlite
    .prepare(
      "INSERT INTO users (id, email, name, role, status, google_sub, created_by, updated_by) VALUES (?, ?, 'Test Doctor', 'doctor', ?, ?, 'system', 'system')",
    )
    .run(id, email, status, sub);
}

const login = (user: StaffUser, bindSub: string | null, tokenHash = "hash-1") =>
  repo().completeLogin({
    user,
    bindSub,
    tokenHash,
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    userAgent: "test",
    requestId: "req-1",
  });

beforeEach(() => {
  t = testDb();
});

describe("auth repository (1.3.8)", () => {
  it("finds staff by lowercase email, not deleted ones", async () => {
    addUser("u1", "doc@example.com");
    expect((await repo().findStaffByEmail("doc@example.com"))?.id).toBe("u1");
    t.sqlite.exec("UPDATE users SET deleted_at = '2026-01-01T00:00:00.000Z' WHERE id = 'u1'");
    expect(await repo().findStaffByEmail("doc@example.com")).toBeUndefined();
  });

  it("first sign-in binds the Google sub, creates a session and logs it, all in one batch", async () => {
    addUser("u1", "doc@example.com");
    const user = (await repo().findStaffByEmail("doc@example.com"))!;
    const sessionId = await login(user, "google-sub-1");
    expect(rows("SELECT google_sub, version FROM users")).toEqual([
      { google_sub: "google-sub-1", version: 2 },
    ]);
    expect(rows("SELECT action, table_name FROM audit_log")).toEqual([
      { action: "update", table_name: "users" },
    ]);
    expect(rows("SELECT id, user_id, token_hash FROM staff_sessions")).toEqual([
      { id: sessionId, user_id: "u1", token_hash: "hash-1" },
    ]);
    expect(rows("SELECT action, created_by, resource_id FROM access_log")).toEqual([
      { action: "login", created_by: "u1", resource_id: sessionId },
    ]);
  });

  it("never overwrites a bound sub", async () => {
    addUser("u1", "doc@example.com", "active", "original-sub");
    const user = (await repo().findStaffByEmail("doc@example.com"))!;
    await login(user, "other-sub");
    expect(rows("SELECT google_sub FROM users")).toEqual([{ google_sub: "original-sub" }]);
    expect(rows("SELECT * FROM audit_log")).toHaveLength(0);
  });

  it("finds a session with its user, and logout revokes it and logs it", async () => {
    addUser("u1", "doc@example.com");
    const user = (await repo().findStaffByEmail("doc@example.com"))!;
    const sessionId = await login(user, null, "hash-xyz");
    const found = await repo().findSession("hash-xyz");
    expect(found).toMatchObject({ sessionId, revokedAt: null, user: { id: "u1", role: "doctor" } });
    await repo().logout(sessionId, { userId: "u1", requestId: "req-2" });
    expect((await repo().findSession("hash-xyz"))?.revokedAt).toMatch(/Z$/);
    expect(rows("SELECT action FROM access_log ORDER BY created_at, action")).toEqual([
      { action: "login" },
      { action: "logout" },
    ]);
  });

  it("logs failed and denied sign-ins as anonymous with a detail", async () => {
    await repo().recordLoginProblem("login_denied", "unknown n***@gmail.com", "req-3");
    expect(rows("SELECT action, created_by, detail FROM access_log")).toEqual([
      { action: "login_denied", created_by: "anonymous", detail: "unknown n***@gmail.com" },
    ]);
  });

  it("branding returns only the clinic name and logo", async () => {
    expect(await repo().branding()).toEqual({ clinicName: "Align Dentistry", logo: null });
  });
});
