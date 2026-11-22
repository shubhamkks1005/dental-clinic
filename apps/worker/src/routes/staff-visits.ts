import { fail, ok } from "@clinic/shared";
import { Hono } from "hono";
import { addVisitAddendum, finaliseVisit, getVisit, openVisit } from "../domain/visits";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

export const staffVisits = new Hono<AppEnv>();

// 3.2.7: clinical visit API. Permission is enforced in the repository (clinical.edit / view).
staffVisits.post("/visits", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await openVisit(signedIn(c).repos, body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ visit: result.visit }), 201);
});

staffVisits.get("/visits/:id", async (c) => {
  const result = await getVisit(signedIn(c).repos, c.req.param("id"));
  return c.json(ok({ visit: result.visit }));
});

staffVisits.post("/visits/:id/finalise", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await finaliseVisit(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ visit: result.visit }));
});

staffVisits.post("/visits/:id/addenda", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await addVisitAddendum(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ addendum: result.addendum }), 201);
});
