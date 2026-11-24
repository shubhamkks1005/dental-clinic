import { fail, ok } from "@clinic/shared";
import { Hono } from "hono";
import { adjustBreak, currentBreak, endBreak, startBreak } from "../domain/breaks";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

export const staffBreaks = new Hono<AppEnv>();

staffBreaks.get("/breaks/current", async (c) => {
  return c.json(ok({ current: await currentBreak(signedIn(c).repos) }));
});

staffBreaks.post("/breaks", async (c) => {
  const result = await startBreak(signedIn(c).repos, await c.req.json().catch(() => null));
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ current: result.current }), 201);
});

staffBreaks.post("/breaks/:id/adjust", async (c) => {
  const body = await c.req.json().catch(() => null);
  const result = await adjustBreak(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ current: result.current }));
});

staffBreaks.post("/breaks/:id/end", async (c) => {
  const body = await c.req.json().catch(() => null);
  const result = await endBreak(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ ended: true }));
});
