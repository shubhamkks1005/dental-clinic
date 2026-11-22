import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "../context";
import { ConflictError, ForbiddenError, NotAllowedError, NotFoundError } from "../errors";
import { testDb } from "../testing";
import { createRepos } from "./index";

// 1.3.6 Settings > Staff. Fake people only.
const ctxOf = (userId: string, role: Ctx["role"] = "doctor"): Ctx => ({
  userId,
  role,
  requestId: `req-${userId}`,
});
const docA = ctxOf("doc-a");

let t: ReturnType<typeof testDb>;
const rows = (sqlText: string) => t.sqlite.prepare(sqlText).all();
const repo = (ctx: Ctx) => createRepos(t.db, ctx).staff;
const user = (id: string) =>
  t.sqlite
    .prepare("SELECT email, role, status, google_sub, version FROM users WHERE id = ?")
    .get(id);
const auditCount = () => rows("SELECT id FROM audit_log").length;
const events = () => rows("SELECT action, resource_id, detail, created_by FROM access_log");
const liveSessions = (userId: string) =>
  rows(`SELECT id FROM staff_sessions WHERE user_id = '${userId}' AND revoked_at IS NULL`).length;

function addUser(id: string, role = "receptionist", status = "active", sub: string | null = null) {
  t.sqlite
    .prepare(
      "INSERT INTO users (id, email, name, role, status, google_sub, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, 'system', 'system')",
    )
    .run(id, `${id}@example.test`, `Test ${id}`, role, status, sub);
}

function addSession(id: string, userId: string) {
  t.sqlite
    .prepare(
      "INSERT INTO staff_sessions (id, user_id, token_hash, expires_at, last_seen_at, created_by, updated_by) VALUES (?, ?, ?, '2099-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z', 'system', 'system')",
    )
    .run(id, userId, `hash-${id}`);
}

beforeEach(() => {
  t = testDb();
  addUser("doc-a", "doctor", "active", "sub-a");
  addUser("rec-1", "receptionist", "active", "sub-r");
});

describe("staff repository: who may use it (1.3.6)", () => {
  it("only the doctor; receptionist and developer get 403", async () => {
    for (const role of ["receptionist", "developer"] as const) {
      const r = repo(ctxOf("x", role));
      await expect(r.list()).rejects.toThrow(ForbiddenError);
      await expect(r.add({ name: "N", email: "n@example.test", role: "doctor" })).rejects.toThrow(
        ForbiddenError,
      );
      await expect(r.deactivate("rec-1", 1)).rejects.toThrow(ForbiddenError);
    }
    expect(auditCount()).toBe(0);
  });
});

describe("staff repository: list and add", () => {
  it("lists active people first, marks 'you' and the Google link, never returns the Google id", async () => {
    addUser("rec-old", "receptionist", "disabled");
    const list = await repo(docA).list();
    expect(list.map((s) => [s.id, s.status, s.isYou, s.googleLinked])).toEqual([
      ["doc-a", "active", true, true],
      ["rec-1", "active", false, true],
      ["rec-old", "disabled", false, false],
    ]);
    expect(JSON.stringify(list)).not.toContain("sub-a");
  });

  it("adds an active receptionist with one audit row and one staff_change event", async () => {
    const id = await repo(docA).add({
      name: "Meena Test",
      email: "meena@example.test",
      role: "receptionist",
    });
    expect(user(id)).toMatchObject({
      email: "meena@example.test",
      role: "receptionist",
      status: "active",
      google_sub: null,
    });
    expect(rows("SELECT action, table_name, row_id, created_by FROM audit_log")).toEqual([
      { action: "create", table_name: "users", row_id: id, created_by: "doc-a" },
    ]);
    expect(events()).toEqual([
      { action: "staff_change", resource_id: id, detail: "add receptionist", created_by: "doc-a" },
    ]);
  });

  it("refuses an email already on the list (also a deactivated person's)", async () => {
    addUser("rec-old", "receptionist", "disabled");
    await expect(
      repo(docA).add({ name: "X", email: "rec-old@example.test", role: "receptionist" }),
    ).rejects.toThrow(NotAllowedError);
    expect(auditCount()).toBe(0);
    expect(events()).toEqual([]);
  });
});

describe("staff repository: deactivate and reactivate", () => {
  it("deactivating ends all that person's sessions in the same batch, and only theirs", async () => {
    addSession("s1", "rec-1");
    addSession("s2", "rec-1");
    addSession("s3", "doc-a");
    await repo(docA).deactivate("rec-1", 1);
    expect(user("rec-1")).toMatchObject({ status: "disabled", version: 2 });
    expect(liveSessions("rec-1")).toBe(0);
    expect(liveSessions("doc-a")).toBe(1);
    expect(auditCount()).toBe(1);
    expect(events()).toEqual([
      { action: "staff_change", resource_id: "rec-1", detail: "deactivate", created_by: "doc-a" },
    ]);
  });

  it("nobody can deactivate themselves", async () => {
    await expect(repo(docA).deactivate("doc-a", 1)).rejects.toThrow(NotAllowedError);
    expect(user("doc-a")).toMatchObject({ status: "active", version: 1 });
    expect(auditCount()).toBe(0);
  });

  it("two doctors deactivating each other at the same moment still leave one active doctor", async () => {
    addUser("doc-b", "doctor", "active");
    const results = await Promise.allSettled([
      repo(docA).deactivate("doc-b", 1),
      repo(ctxOf("doc-b")).deactivate("doc-a", 1),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    // Both early checks passed; the guard inside the UPDATE refused the second one.
    expect(results.find((r) => r.status === "rejected")?.reason).toBeInstanceOf(ConflictError);
    expect(rows("SELECT id FROM users WHERE role = 'doctor' AND status = 'active'")).toHaveLength(
      1,
    );
    expect(auditCount()).toBe(1);
    expect(events()).toHaveLength(1);
  });

  it("reactivates a deactivated person (sessions stay ended; they sign in again)", async () => {
    addUser("rec-old", "receptionist", "disabled");
    await repo(docA).reactivate("rec-old", 1);
    expect(user("rec-old")).toMatchObject({ status: "active", version: 2 });
    expect(events()).toEqual([
      { action: "staff_change", resource_id: "rec-old", detail: "reactivate", created_by: "doc-a" },
    ]);
    await expect(repo(docA).reactivate("rec-old", 2)).rejects.toThrow(NotAllowedError);
  });
});

describe("staff repository: change role", () => {
  it("changes a receptionist to doctor with before/after in the audit row", async () => {
    await repo(docA).changeRole("rec-1", "doctor", 1);
    expect(user("rec-1")).toMatchObject({ role: "doctor", version: 2 });
    const [audit] = rows("SELECT before_json, after_json FROM audit_log");
    expect(JSON.parse(String(audit?.before_json))).toEqual({ role: "receptionist" });
    expect(JSON.parse(String(audit?.after_json))).toEqual({ role: "doctor" });
    expect(events()[0]).toMatchObject({ detail: "role receptionist to doctor" });
  });

  it("refuses: own role, same role, a developer account, and the last active doctor in a race", async () => {
    addUser("dev-1", "developer");
    await expect(repo(docA).changeRole("doc-a", "receptionist", 1)).rejects.toThrow(
      NotAllowedError,
    );
    await expect(repo(docA).changeRole("rec-1", "receptionist", 1)).rejects.toThrow(
      NotAllowedError,
    );
    await expect(repo(docA).changeRole("dev-1", "doctor", 1)).rejects.toThrow(NotAllowedError);

    addUser("doc-b", "doctor", "active");
    const results = await Promise.allSettled([
      repo(docA).changeRole("doc-b", "receptionist", 1),
      repo(ctxOf("doc-b")).changeRole("doc-a", "receptionist", 1),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.find((r) => r.status === "rejected")?.reason).toBeInstanceOf(ConflictError);
    expect(rows("SELECT id FROM users WHERE role = 'doctor' AND status = 'active'")).toHaveLength(
      1,
    );
    expect(auditCount()).toBe(1);
  });

  it("a deactivated doctor can be changed to receptionist even with one active doctor", async () => {
    addUser("doc-old", "doctor", "disabled");
    await repo(docA).changeRole("doc-old", "receptionist", 1);
    expect(user("doc-old")).toMatchObject({ role: "receptionist" });
  });
});

describe("staff repository: reset Google link", () => {
  it("sets the (new) email, clears the Google link and ends the person's sessions", async () => {
    addSession("s1", "rec-1");
    await repo(docA).resetGoogleLink("rec-1", "rec-new@example.test", 1);
    expect(user("rec-1")).toMatchObject({
      email: "rec-new@example.test",
      google_sub: null,
      version: 2,
    });
    expect(liveSessions("rec-1")).toBe(0);
    const [audit] = rows("SELECT before_json, after_json FROM audit_log");
    expect(JSON.parse(String(audit?.after_json))).toEqual({
      email: "rec-new@example.test",
      googleLink: "none",
    });
    expect(events()[0]).toMatchObject({ detail: "google link reset" });
  });

  it("refuses your own link and an email someone else has", async () => {
    addUser("rec-2");
    await expect(repo(docA).resetGoogleLink("doc-a", "x@example.test", 1)).rejects.toThrow(
      NotAllowedError,
    );
    await expect(repo(docA).resetGoogleLink("rec-1", "rec-2@example.test", 1)).rejects.toThrow(
      NotAllowedError,
    );
    expect(user("rec-1")).toMatchObject({ google_sub: "sub-r", version: 1 });
    expect(auditCount()).toBe(0);
  });
});

describe("staff repository: stale page and unknown id", () => {
  it("an old version changes nothing and says reload (409)", async () => {
    addSession("s1", "rec-1");
    await expect(repo(docA).deactivate("rec-1", 7)).rejects.toThrow(ConflictError);
    expect(user("rec-1")).toMatchObject({ status: "active", version: 1 });
    expect(liveSessions("rec-1")).toBe(1);
    expect(auditCount()).toBe(0);
    expect(events()).toEqual([]);
  });

  it("an unknown id is 'not found'", async () => {
    await expect(repo(docA).reactivate("nobody", 1)).rejects.toThrow(NotFoundError);
  });
});
