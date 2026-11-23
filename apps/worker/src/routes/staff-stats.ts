import { ok } from "@clinic/shared";
import { Hono } from "hono";
import { contactCallList, listCallList } from "../domain/call-lists";
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

// 6.3.8: receptionist today summary (reports.today).
staffStats.get("/dashboard/today-summary", async (c) => {
  const summary = await signedIn(c).repos.todaySummary.get();
  return c.json(ok(summary));
});

// 6.3.7: call lists (reports.full).
staffStats.get("/call-lists/:kind", async (c) => {
  const result = await listCallList(signedIn(c).repos, c.req.param("kind"));
  return c.json(ok(result));
});

staffStats.post("/call-lists/:kind/:patientId/contact", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  await contactCallList(signedIn(c).repos, c.req.param("kind"), c.req.param("patientId"), body);
  return c.json(ok({ contacted: true }));
});

// 6.2.3: manual stats recompute (reports.full). Cron does the same without rate limit.
staffStats.post("/stats/recompute", async (c) => {
  const result = await recomputeStats(signedIn(c).repos);
  return c.json(ok({ days: result.days }));
});
