import { describe, expect, it } from "vitest";
import { makeEnv } from "../testing/app-env";
import { isPurgeTick, purgeIsLive, runRetentionPurge } from "./retention-purge";

const NOW = new Date("2026-11-23T20:30:00.000Z");

function addOldError(sqlite: ReturnType<typeof makeEnv>["sqlite"]) {
  sqlite
    .prepare(
      `INSERT INTO error_log (id, created_at, created_by, updated_by, source, kind, message)
       VALUES ('old', '2025-01-01T00:00:00.000Z', 's', 's', 'browser', 'E', 'm')`,
    )
    .run();
}
const rows = (sqlite: ReturnType<typeof makeEnv>["sqlite"]) =>
  (sqlite.prepare("SELECT COUNT(*) n FROM error_log").get() as { n: number }).n;

describe("retention purge cron (9.3.10)", () => {
  it("runs once a day at 02:00 IST only", () => {
    expect(isPurgeTick(new Date("2026-11-23T20:30:00Z"))).toBe(true);
    expect(isPurgeTick(new Date("2026-11-23T20:35:00Z"))).toBe(false);
    expect(isPurgeTick(new Date("2026-11-23T21:30:00Z"))).toBe(false);
  });

  it("is a dry run unless RETENTION_MODE is exactly live", async () => {
    expect(purgeIsLive({} as never)).toBe(false);
    expect(purgeIsLive({ RETENTION_MODE: "true" } as never)).toBe(false);
    const { env, sqlite } = makeEnv();
    addOldError(sqlite);
    const result = await runRetentionPurge(env, NOW);
    expect(result).toMatchObject({ mode: "dry_run", total: 1 });
    expect(rows(sqlite)).toBe(1);
  });

  it("deletes when live and writes an audit row", async () => {
    const { env, sqlite } = makeEnv({ RETENTION_MODE: "live" });
    addOldError(sqlite);
    const result = await runRetentionPurge(env, NOW);
    expect(result.mode).toBe("live");
    expect(rows(sqlite)).toBe(0);
    const audit = sqlite
      .prepare("SELECT COUNT(*) n FROM audit_log WHERE table_name = 'retention_run'")
      .get() as { n: number };
    expect(audit.n).toBe(1);
  });
});
