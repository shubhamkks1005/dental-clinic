import { describe, expect, it } from "vitest";
import { PURGE_ROW_LIMIT, runRetentionPurge } from "./retention-purge";

describe("retention purge (9.3.10)", () => {
  it("limits rows per tick", () => {
    expect(PURGE_ROW_LIMIT).toBeLessThanOrEqual(200);
  });

  it("returns deleted count on empty fake DB", async () => {
    const run = async () => ({ meta: { changes: 0 } });
    const env = {
      DB: {
        prepare: () => ({ bind: () => ({ run }) }),
      },
    } as never;
    const result = await runRetentionPurge(env, new Date("2026-11-23T00:00:00.000Z"));
    expect(result.deleted).toBe(0);
  });
});

describe("retention purge on a real migrated DB (9.3.10)", () => {
  it("soft-deletes only message_attempts older than 90 days", async () => {
    const { FakeD1, migratedSqlite } = await import("@clinic/db/testing");
    const sqlite = migratedSqlite();
    const ins = sqlite.prepare(
      `INSERT INTO message_attempts (id, created_at, created_by, updated_by, outbox_id, attempt_no, at, adapter, result)
       VALUES (?, ?, 's', 's', 'o1', 1, ?, 'fake', 'ok')`,
    );
    ins.run("old", "2026-06-01T00:00:00.000Z", "2026-06-01T00:00:00.000Z");
    ins.run("new", "2026-11-01T00:00:00.000Z", "2026-11-01T00:00:00.000Z");
    const env = { DB: new FakeD1(sqlite) } as never;
    const result = await runRetentionPurge(env, new Date("2026-11-23T00:00:00.000Z"));
    expect(result.deleted).toBe(1);
    const rows = sqlite
      .prepare("SELECT id, deleted_at FROM message_attempts ORDER BY id")
      .all() as {
      id: string;
      deleted_at: string | null;
    }[];
    expect(rows.find((r) => r.id === "old")?.deleted_at).not.toBeNull();
    expect(rows.find((r) => r.id === "new")?.deleted_at).toBeNull();
  });
});
