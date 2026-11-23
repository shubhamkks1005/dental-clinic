import { describe, expect, it } from "vitest";
import { testDb } from "../testing";
import { createRepos } from "./index";
import { PURGE_ROW_LIMIT } from "./retention";

const NOW = new Date("2026-11-23T00:00:00.000Z");
const OLD = "2025-01-01T00:00:00.000Z";
const RECENT = "2026-11-20T00:00:00.000Z";

function setup() {
  const { db, sqlite } = testDb();
  const repos = createRepos(db, { userId: "system", role: "doctor", requestId: "cron-test" });
  const n = (q: string) => (sqlite.prepare(q).get() as { n: number }).n;
  return { sqlite, repos, n };
}

function addError(sqlite: ReturnType<typeof setup>["sqlite"], id: string, at: string) {
  sqlite
    .prepare(
      `INSERT INTO error_log (id, created_at, created_by, updated_by, source, kind, message)
       VALUES (?, ?, 's', 's', 'browser', 'E', 'm')`,
    )
    .run(id, at);
}

describe("retention purge (9.3.10)", () => {
  it("dry run counts but deletes nothing, and records one audit row", async () => {
    const { sqlite, repos, n } = setup();
    addError(sqlite, "old", OLD);
    addError(sqlite, "new", RECENT);
    const r = await repos.retention.purge(NOW, false);
    expect(r).toMatchObject({ mode: "dry_run", total: 1 });
    expect(n("SELECT COUNT(*) n FROM error_log")).toBe(2);
    expect(n("SELECT COUNT(*) n FROM audit_log WHERE table_name = 'retention_run'")).toBe(1);
  });

  it("live run removes only error rows older than 30 days and audits it", async () => {
    const { sqlite, repos, n } = setup();
    addError(sqlite, "old", OLD);
    addError(sqlite, "new", RECENT);
    const r = await repos.retention.purge(NOW, true);
    expect(r.mode).toBe("live");
    expect(n("SELECT COUNT(*) n FROM error_log WHERE id = 'new'")).toBe(1);
    expect(n("SELECT COUNT(*) n FROM error_log WHERE id = 'old'")).toBe(0);
    expect(
      n(
        "SELECT COUNT(*) n FROM audit_log WHERE table_name = 'retention_run' AND action = 'delete'",
      ),
    ).toBe(1);
  });

  it("never touches patients, visits, bills or the audit log", async () => {
    const { sqlite, repos, n } = setup();
    sqlite
      .prepare(
        `INSERT INTO patients (id, created_at, created_by, updated_by, code, full_name, gender, age_years_at_reg, mobile, status)
         VALUES ('p1', ?, 'system', 'system', 'P-000001', 'Fake Old Patient', 'female', 30, '+919000000001', 'active')`,
      )
      .run(OLD);
    sqlite
      .prepare(
        `INSERT INTO audit_log (id, created_at, created_by, updated_by, action, table_name, row_id, request_id)
         VALUES ('a1', ?, 's', 's', 'create', 'patients', 'p1', 'r')`,
      )
      .run(OLD);
    addError(sqlite, "old", OLD);
    await repos.retention.purge(NOW, true);
    expect(n("SELECT COUNT(*) n FROM patients")).toBe(1);
    expect(n("SELECT COUNT(*) n FROM audit_log WHERE id = 'a1'")).toBe(1);
  });

  it("an empty system writes no audit row", async () => {
    const { repos, n } = setup();
    const r = await repos.retention.purge(NOW, true);
    expect(r.total).toBe(0);
    expect(n("SELECT COUNT(*) n FROM audit_log WHERE table_name = 'retention_run'")).toBe(0);
  });

  it("is row limited per run", async () => {
    const { sqlite, repos, n } = setup();
    for (let i = 0; i < PURGE_ROW_LIMIT + 5; i++) addError(sqlite, `old${i}`, OLD);
    await repos.retention.purge(NOW, true);
    expect(n("SELECT COUNT(*) n FROM error_log")).toBe(5);
  });

  it("purges finished old messages and attempts, keeps queued ones", async () => {
    const { sqlite, repos, n } = setup();
    const outbox = sqlite.prepare(
      `INSERT INTO message_outbox (id, created_at, created_by, updated_by, patient_id, kind, channel,
         template_key, params_json, status, dedupe_key, send_after, expire_at)
       VALUES (?, ?, 's', 's', 'p', 'remind', 'sms', 't', '{}', ?, ?, ?, ?)`,
    );
    outbox.run("done-old", OLD, "sent", "k1", OLD, OLD);
    outbox.run("queued-old", OLD, "queued", "k2", OLD, OLD);
    outbox.run("done-new", RECENT, "sent", "k3", RECENT, RECENT);
    sqlite
      .prepare(
        `INSERT INTO message_attempts (id, created_at, created_by, updated_by, outbox_id, attempt_no, at, adapter, result)
         VALUES ('att-old', ?, 's', 's', 'done-old', 1, ?, 'fake', 'ok')`,
      )
      .run(OLD, OLD);
    await repos.retention.purge(NOW, true); // attempts go first, then the message with none left
    expect(n("SELECT COUNT(*) n FROM message_attempts")).toBe(0);
    expect(n("SELECT COUNT(*) n FROM message_outbox WHERE id = 'done-old'")).toBe(0);
    expect(n("SELECT COUNT(*) n FROM message_outbox WHERE id IN ('queued-old', 'done-new')")).toBe(
      2,
    );
  });
});
