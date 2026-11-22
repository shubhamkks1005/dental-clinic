import { ok } from "@clinic/shared";
import { Hono } from "hono";
import { getHistorySummary } from "../domain/history";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

export const staffHistory = new Hono<AppEnv>();

// 3.5.11: History tab pinned summary (feed comes in 3.5.12).
staffHistory.get("/patients/:id/history/summary", async (c) => {
  const result = await getHistorySummary(signedIn(c).repos, c.req.param("id"));
  return c.json(ok({ summary: result.summary }));
});
