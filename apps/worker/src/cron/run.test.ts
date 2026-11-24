import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Bindings } from "../types";

vi.mock("./daily-stats", () => ({ runNightlyDailyStats: vi.fn() }));
vi.mock("./messaging", () => ({ runMessagingTick: vi.fn() }));
vi.mock("./quota", () => ({ runQuotaMonitor: vi.fn() }));
vi.mock("./retention-purge", () => ({ isPurgeTick: vi.fn(), runRetentionPurge: vi.fn() }));

import { runNightlyDailyStats } from "./daily-stats";
import { runMessagingTick } from "./messaging";
import { runQuotaMonitor } from "./quota";
import { isPurgeTick, runRetentionPurge } from "./retention-purge";
import { handleScheduled } from "./run";

const env = {} as Bindings;
// 12:00 UTC: minute 0, so the quota branch runs too.
const event = { scheduledTime: Date.parse("2026-11-24T12:00:00.000Z"), cron: "*/5 * * * *" };

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("cron isolation (S1.2.2)", () => {
  it("messaging tick still runs when stats fails", async () => {
    vi.mocked(runNightlyDailyStats).mockRejectedValue(new TypeError("boom"));
    await handleScheduled(event, env);
    expect(runMessagingTick).toHaveBeenCalledTimes(1);
    expect(runQuotaMonitor).toHaveBeenCalledTimes(1);
  });

  it("each job failing alone does not stop the rest", async () => {
    vi.mocked(isPurgeTick).mockReturnValue(true);
    vi.mocked(runMessagingTick).mockRejectedValue(new Error("x"));
    vi.mocked(runQuotaMonitor).mockRejectedValue(new Error("y"));
    await handleScheduled(event, env);
    expect(runNightlyDailyStats).toHaveBeenCalledTimes(1);
    expect(runRetentionPurge).toHaveBeenCalledTimes(1);
  });

  it("logs only the job id and error type, never the message", async () => {
    vi.mocked(runNightlyDailyStats).mockRejectedValue(new RangeError("Asha Verma 9876543210"));
    await handleScheduled(event, env);
    const lines = vi.mocked(console.error).mock.calls.map((c) => String(c[0]));
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0] as string)).toEqual({
      level: "error",
      event: "cron_job_failed",
      job: "stats",
      errorType: "RangeError",
    });
    expect(lines[0]).not.toContain("Asha");
  });
});
