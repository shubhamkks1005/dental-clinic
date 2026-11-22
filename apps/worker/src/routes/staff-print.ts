import { fail, ok, parseRecordPrint } from "@clinic/shared";
import { Hono } from "hono";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

export const staffPrint = new Hono<AppEnv>();

// 4.3.5 print log.
staffPrint.post("/print-log", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const parsed = parseRecordPrint(body);
  if (!parsed.ok) return c.json(fail("invalid", parsed.message), 400);
  const result = await signedIn(c).repos.printLog.record(parsed.value);
  return c.json(ok(result), 201);
});

staffPrint.get("/print-log/preview", async (c) => {
  const kind = c.req.query("kind") ?? "";
  const id = c.req.query("id") ?? "";
  if (!kind || !id) return c.json(fail("invalid", "Missing document."), 400);
  const isReprint = await signedIn(c).repos.printLog.nextIsReprint(kind, id);
  return c.json(ok({ isReprint }));
});
