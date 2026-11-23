import { createDb, createRepos } from "@clinic/db";
import { FakeD1, migratedSqlite } from "@clinic/db/testing";
import { describe, expect, it } from "vitest";
import { acceptOpsStatus, opsSignature } from "./ops-status";

describe("ops-status webhook (9.1.10)", () => {
  it("rejects bad signature and accepts a good one", async () => {
    const sqlite = migratedSqlite();
    const db = createDb(new FakeD1(sqlite) as never);
    const repos = createRepos(db, { userId: "system", role: "doctor", requestId: "t" });
    const secret = "test-ops-secret";
    const body = JSON.stringify({
      key: "backup_d1",
      status: "ok",
      checkedAt: "2026-11-23T21:05:00.000Z",
      detail: { sizeBytes: 1000, file: "d1-fake.sql.age" },
    });

    const bad = await acceptOpsStatus(repos, secret, body, "nope");
    expect(bad.ok).toBe(false);

    const sig = await opsSignature(body, secret);
    const good = await acceptOpsStatus(repos, secret, body, sig);
    expect(good.ok).toBe(true);

    const rows = await repos.opsStatus.list();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.key).toBe("backup_d1");
    expect(rows[0]?.status).toBe("ok");
  });
});
