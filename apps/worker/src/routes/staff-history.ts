import { fail, ok } from "@clinic/shared";
import { Hono } from "hono";
import { getHistorySummary, listHistoryFeed } from "../domain/history";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

export const staffHistory = new Hono<AppEnv>();

// 3.5.11: History tab pinned summary.
staffHistory.get("/patients/:id/history/summary", async (c) => {
  const result = await getHistorySummary(signedIn(c).repos, c.req.param("id"));
  return c.json(ok({ summary: result.summary }));
});

// 3.5.12: merged newest-first feed with cursor pagination.
staffHistory.get("/patients/:id/history", async (c) => {
  const result = await listHistoryFeed(signedIn(c).repos, c.req.param("id"), {
    cursor: c.req.query("cursor"),
    limit: c.req.query("limit"),
  });
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ entries: result.entries, nextCursor: result.nextCursor }));
});
