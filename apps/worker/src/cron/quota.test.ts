import { createDb, createRepos } from "@clinic/db";
import { FakeD1, migratedSqlite } from "@clinic/db/testing";
import { describe, expect, it } from "vitest";
import type { Bindings } from "../types";
import { evaluateQuota, runQuotaMonitor } from "./quota";

describe("quota monitor (9.2.1)", () => {
  it("thresholds", () => {
    expect(evaluateQuota(10).threshold).toBe("none");
    expect(evaluateQuota(50_000).threshold).toBe("warn");
    expect(evaluateQuota(80_000).status).toBe("fail");
    expect(evaluateQuota(95_000).threshold).toBe("crit");
  });

  it("records ops_status on injected high count", async () => {
    const sqlite = migratedSqlite();
    const env = { DB: new FakeD1(sqlite) } as unknown as Bindings;
    const result = await runQuotaMonitor(env, new Date("2026-11-23T12:00:00.000Z"), {
      requestCount: 80_000,
    });
    expect(result.threshold).toBe("fail");
    const repos = createRepos(createDb(env.DB), {
      userId: "system",
      role: "doctor",
      requestId: "t",
    });
    const rows = await repos.opsStatus.list();
    expect(rows.find((r) => r.key === "quota")?.status).toBe("fail");
  });
});
