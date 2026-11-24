import { describe, expect, it } from "vitest";
import { testDb } from "../testing";
import { createRepos } from "./index";

// T1.9: the new Part T tables have a growth cap (docs/RETENTION.md).
const NOW = new Date("2026-11-25T00:00:00.000Z");
const OLD = "2025-01-01T00:00:00.000Z";
const RECENT = "2026-11-20T00:00:00.000Z";

function setup() {
  const { db, sqlite } = testDb();
  const repos = createRepos(db, { userId: "system", role: "doctor", requestId: "cron-test" });
  const n = (q: string) => Number((sqlite.prepare(q).get() as { n: number }).n);
  return { sqlite, repos, n };
}

describe("retention: doctor_breaks and approval_requests", () => {
  it("purges breaks older than 90 days and keeps recent ones", async () => {
    const { sqlite, repos, n } = setup();
    const ins = sqlite.prepare(
      `INSERT INTO doctor_breaks (id, created_at, created_by, updated_by, started_at, date_local, minutes, label, ended_at)
       VALUES (?, ?, 's', 's', ?, ?, 10, 'Break', ?)`,
    );
    ins.run("old", OLD, OLD, "2025-01-01", OLD);
    ins.run("new", RECENT, RECENT, "2026-11-20", RECENT);
    await repos.retention.purge(NOW, true);
    expect(n("SELECT COUNT(*) n FROM doctor_breaks WHERE id = 'old'")).toBe(0);
    expect(n("SELECT COUNT(*) n FROM doctor_breaks WHERE id = 'new'")).toBe(1);
  });

  it("purges closed, non-refund requests older than a year; keeps open, refund and recent ones", async () => {
    const { sqlite, repos, n } = setup();
    const ins = sqlite.prepare(
      `INSERT INTO approval_requests (id, created_at, created_by, updated_by, type, status, patient_id, note)
       VALUES (?, ?, 's', 's', ?, ?, 'p', 'n')`,
    );
    ins.run("old-closed", OLD, "overbook", "approved");
    ins.run("old-open", OLD, "overbook", "open");
    ins.run("old-refund", OLD, "refund", "approved");
    ins.run("new-closed", RECENT, "overbook", "approved");
    const dry = await repos.retention.purge(NOW, false);
    expect(dry.tables.find((t) => t.table === "approval_requests")?.eligible).toBe(1);
    expect(n("SELECT COUNT(*) n FROM approval_requests")).toBe(4);
    await repos.retention.purge(NOW, true);
    const left = (
      sqlite.prepare("SELECT id FROM approval_requests ORDER BY id").all() as { id: string }[]
    ).map((r) => r.id);
    expect(left).toEqual(["new-closed", "old-open", "old-refund"]);
  });

  it("never touches appointments, bills or the audit log", async () => {
    const { sqlite, repos, n } = setup();
    sqlite
      .prepare(
        `INSERT INTO appointments (id, created_at, created_by, updated_by, patient_id, chair_id, visit_type_id, visit_type_label, start_at, date_local, start_min, end_min, status, source, priority, overbook)
         VALUES ('a1', ?, 's', 's', 'p', '1', 'vt', 'C', ?, '2025-01-01', 600, 630, 'completed', 'phone', 'normal', 0)`,
      )
      .run(OLD, OLD);
    await repos.retention.purge(NOW, true);
    expect(n("SELECT COUNT(*) n FROM appointments")).toBe(1);
  });
});
