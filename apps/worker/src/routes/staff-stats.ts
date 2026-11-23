import { ok } from "@clinic/shared";
import { Hono } from "hono";
import { getDashboard } from "../domain/dashboard";
import { recomputeStats } from "../domain/stats";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

export const staffStats = new Hono<AppEnv>();

// 6.3.1: prepared dashboard arrays (reports.full).
staffStats.get("/dashboard", async (c) => {
  const data = await getDashboard(signedIn(c).repos, {
    range: c.req.query("range"),
    from: c.req.query("from"),
    to: c.req.query("to"),
    compare: c.req.query("compare"),
  });
  return c.json(ok(data));
});

// 6.2.3: manual stats recompute (reports.full). Cron does the same without rate limit.
staffStats.post("/stats/recompute", async (c) => {
  const result = await recomputeStats(signedIn(c).repos);
  return c.json(ok({ days: result.days }));
});
