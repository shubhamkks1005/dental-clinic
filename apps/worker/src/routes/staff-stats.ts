import { ok } from "@clinic/shared";
import { Hono } from "hono";
import { recomputeStats } from "../domain/stats";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

export const staffStats = new Hono<AppEnv>();

// 6.2.3: manual stats recompute (reports.full). Cron does the same without rate limit.
staffStats.post("/stats/recompute", async (c) => {
  const result = await recomputeStats(signedIn(c).repos);
  return c.json(ok({ days: result.days }));
});
