import { describe, expect, it } from "vitest";
import { BACKUP_STALE_HOURS, backupAttentionLine, opsStatusHookBodySchema } from "./ops-status";

describe("ops-status (9.1.10)", () => {
  it("parses a clean hook body", () => {
    const parsed = opsStatusHookBodySchema.parse({
      key: "backup_d1",
      status: "ok",
      checkedAt: "2026-11-23T21:00:00.000Z",
      detail: { sizeBytes: 38_000_000, file: "d1-x.sql.age" },
    });
    expect(parsed.key).toBe("backup_d1");
  });

  it("marks stale backup as bad after grace", () => {
    const now = Date.parse("2026-11-24T10:00:00.000Z");
    const checkedAt = new Date(now - (BACKUP_STALE_HOURS + 1) * 3_600_000).toISOString();
    const line = backupAttentionLine(
      { status: "ok", checkedAt, detail: { sizeBytes: 1_000_000 } },
      now,
    );
    expect(line.tone).toBe("bad");
    expect(line.text).toMatch(/stale/i);
  });

  it("marks recent ok as ok", () => {
    const now = Date.parse("2026-11-24T10:00:00.000Z");
    const checkedAt = new Date(now - 2 * 3_600_000).toISOString();
    const line = backupAttentionLine(
      { status: "ok", checkedAt, detail: { sizeBytes: 38_000_000 } },
      now,
    );
    expect(line.tone).toBe("ok");
    expect(line.text).toMatch(/ok/i);
  });
});
