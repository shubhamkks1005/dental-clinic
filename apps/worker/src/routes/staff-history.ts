import { fail, ok } from "@clinic/shared";
import { Hono } from "hono";
import {
  createPastRecord,
  getHistoryPrintSummary,
  getHistorySummary,
  listHistoryFeed,
} from "../domain/history";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

export const staffHistory = new Hono<AppEnv>();

// 3.5.11: History tab pinned summary.
staffHistory.get("/patients/:id/history/summary", async (c) => {
  const result = await getHistorySummary(signedIn(c).repos, c.req.param("id"));
  return c.json(ok({ summary: result.summary }));
});

// 6.7.2: doctor-only A4 print payload (must be before /history so :id/history is not greedy).
staffHistory.get("/patients/:id/history/print-summary", async (c) => {
  const result = await getHistoryPrintSummary(signedIn(c).repos, c.req.param("id"));
  return c.json(ok({ summary: result.summary }));
});

// 6.7.3: doctor-only past/paper note.
staffHistory.post("/patients/:id/history/past-records", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await createPastRecord(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ record: result.record }), 201);
});

// 3.5.12 / 6.7.1: merged newest-first feed with cursor pagination + filters.
staffHistory.get("/patients/:id/history", async (c) => {
  const result = await listHistoryFeed(signedIn(c).repos, c.req.param("id"), {
    cursor: c.req.query("cursor"),
    limit: c.req.query("limit"),
    chip: c.req.query("chip"),
    from: c.req.query("from"),
    to: c.req.query("to"),
    tooth: c.req.query("tooth"),
    q: c.req.query("q"),
  });
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ entries: result.entries, nextCursor: result.nextCursor }));
});
