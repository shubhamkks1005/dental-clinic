import { fail, ok } from "@clinic/shared";
import { Hono } from "hono";
import {
  addVisitAddendum,
  addVisitDiagnosis,
  addVisitProcedure,
  finaliseVisit,
  getVisit,
  listRecentVisits,
  openVisit,
  patchVisit,
} from "../domain/visits";
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

// 3.5.2: last N visits for the visit screen side panel (doctor only).
staffVisits.get("/patients/:id/visits", async (c) => {
  const raw = c.req.query("limit");
  const limit = raw ? Number(raw) : undefined;
  const result = await listRecentVisits(
    signedIn(c).repos,
    c.req.param("id"),
    Number.isFinite(limit) ? limit : undefined,
  );
  return c.json(ok({ visits: result.visits }));
});

staffVisits.get("/visits/:id", async (c) => {
  const result = await getVisit(signedIn(c).repos, c.req.param("id"));
  return c.json(ok({ visit: result.visit }));
});

// 3.5.3: draft notes / vitals patch (no audit per save — PLAN exception).
staffVisits.patch("/visits/:id", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await patchVisit(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ visit: result.visit }));
});

staffVisits.post("/visits/:id/diagnoses", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await addVisitDiagnosis(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ diagnosis: result.diagnosis }), 201);
});

staffVisits.post("/visits/:id/procedures", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await addVisitProcedure(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ procedure: result.procedure }), 201);
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
