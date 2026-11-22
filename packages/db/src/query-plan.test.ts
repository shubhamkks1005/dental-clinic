import { beforeEach, describe, expect, it } from "vitest";
import type { Ctx } from "./context";
import { authRepo } from "./repos/auth";
import { createRepos } from "./repos/index";
import { fullScans, queryPlan, recordingDb, scansIn } from "./testing";

// 1.2.8: every statement the repositories run reaches growing tables through an index.
// New tables are "big" by default (testing/query-plan.ts), so the patient search in Phase 2
// falls under this guard as soon as its repository has a line below.
const doctor: Ctx = { userId: "doc-a", role: "doctor", requestId: "req-1" };

let t: ReturnType<typeof recordingDb>;
const addUser = (id: string, role: string) =>
  t.sqlite
    .prepare(
      "INSERT INTO users (id, email, name, role, created_by, updated_by) VALUES (?, ?, ?, ?, 's', 's')",
    )
    .run(id, `${id}@example.test`, `Test ${id}`, role);

beforeEach(() => {
  t = recordingDb();
  addUser("doc-a", "doctor");
  addUser("rec-1", "receptionist");
});

describe("query-plan guard (1.2.8)", () => {
  it("catches a query that reads a whole growing table", () => {
    const plan = queryPlan(t.sqlite, "SELECT id FROM audit_log WHERE request_id = ?", ["r"]);
    expect(fullScans(plan)).toEqual(["SCAN audit_log"]);
    expect(fullScans(queryPlan(t.sqlite, "SELECT id FROM users WHERE name = ?", ["x"]))).toEqual(
      [],
    );
  });

  it("sign-in and session statements use indexes", async () => {
    const auth = authRepo(t.db);
    const user = await auth.findStaffByEmail("doc-a@example.test");
    if (!user) throw new Error("seed user missing");
    const sessionId = await auth.completeLogin({
      user,
      bindSub: "sub-a",
      tokenHash: "hash-1",
      expiresAt: "2099-01-01T00:00:00.000Z",
      userAgent: null,
      requestId: "req-1",
    });
    await auth.findSession("hash-1");
    await auth.touchSession(sessionId);
    await auth.logout(sessionId, { userId: "doc-a", requestId: "req-2" });
    await auth.recordLoginProblem("login_denied", "unknown n***@example.test", "req-3");
    await auth.branding();
    expect(t.ran.length).toBeGreaterThan(5);
    expect(scansIn(t.sqlite, t.ran)).toEqual([]);
  });

  it("staff and settings statements use indexes", async () => {
    const repos = createRepos(t.db, doctor);
    const auth = authRepo(t.db);
    const rec = await auth.findStaffByEmail("rec-1@example.test");
    if (!rec) throw new Error("seed user missing");
    await auth.completeLogin({
      user: rec,
      bindSub: null,
      tokenHash: "hash-r",
      expiresAt: "2099-01-01T00:00:00.000Z",
      userAgent: null,
      requestId: "req-r",
    });
    t.ran.length = 0;

    await repos.staff.list();
    const id = await repos.staff.add({
      name: "New",
      email: "new@example.test",
      role: "receptionist",
    });
    await repos.staff.changeRole(id, "doctor", 1);
    await repos.staff.deactivate("rec-1", 1);
    await repos.staff.reactivate("rec-1", 2);
    await repos.staff.resetGoogleLink("rec-1", "rec-new@example.test", 3);
    const setting = await repos.settings.get("patient_code.prefix");
    await repos.settings.update("patient_code.prefix", "P-", setting.version);
    await repos.settings.list();
    await repos.lists.add("referral_sources", { label: "A", data: {} });
    const [b] = await repos.lists
      .add("referral_sources", { label: "B", data: {} })
      .then((l) => l.slice(1));
    if (!b) throw new Error("no item");
    await repos.lists.move("referral_sources", b.id, "up", b.version);
    await repos.lists.update("referral_sources", b.id, { label: "B2", data: {} }, b.version + 1);
    expect(t.ran.length).toBeGreaterThan(10);
    expect(scansIn(t.sqlite, t.ran)).toEqual([]);
  });
});
