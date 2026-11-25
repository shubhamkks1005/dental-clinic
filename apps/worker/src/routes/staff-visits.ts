import { fail, ok } from "@clinic/shared";
import { Hono } from "hono";
import {
  addVisitAddendum,
  addVisitDiagnosis,
  addVisitProcedure,
  finaliseVisit,
  getVisit,
  getVisitAfter,
  getVisitPage,
  listDraftVisits,
  listRecentVisits,
  listVisitTimeline,
  openVisit,
  patchVisit,
  removeVisitDiagnosis,
  removeVisitProcedure,
  restoreVisitDiagnosis,
  restoreVisitProcedure,
  updateVisitDiagnosis,
  updateVisitProcedure,
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

// 3.5.8: incomplete drafts for Today (before /visits/:id so "drafts" is not an id).
staffVisits.get("/visits/drafts", async (c) => {
  const result = await listDraftVisits(signedIn(c).repos);
  return c.json(ok({ visits: result.visits }));
});

// 3.5.9: full visit timeline with optional filters (before the short recent list path).
staffVisits.get("/patients/:id/visits/timeline", async (c) => {
  const rawLimit = c.req.query("limit");
  const limit = rawLimit ? Number(rawLimit) : undefined;
  const result = await listVisitTimeline(signedIn(c).repos, c.req.param("id"), {
    limit: Number.isFinite(limit) ? limit : undefined,
    diagnosis: c.req.query("diagnosis") || undefined,
    procedure: c.req.query("procedure") || undefined,
  });
  return c.json(ok({ visits: result.visits }));
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

// B5: one read for the whole visit page (<= 10 queries, two round trips).
staffVisits.get("/visits/:id/page", async (c) => {
  const result = await getVisitPage(signedIn(c).repos, c.req.param("id"));
  return c.json(ok(result.page));
});

// The page after a visit: today's details and bill state in one read (doctor only).
staffVisits.get("/visits/:id/after", async (c) => {
  const result = await getVisitAfter(signedIn(c).repos, c.req.param("id"));
  return c.json(ok(result.after));
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

staffVisits.patch("/visits/:id/diagnoses/:lineId", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await updateVisitDiagnosis(
    signedIn(c).repos,
    c.req.param("id"),
    c.req.param("lineId"),
    body,
  );
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ diagnosis: result.diagnosis }));
});

staffVisits.delete("/visits/:id/diagnoses/:lineId", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await removeVisitDiagnosis(
    signedIn(c).repos,
    c.req.param("id"),
    c.req.param("lineId"),
    body,
  );
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ version: result.version }));
});

staffVisits.post("/visits/:id/diagnoses/:lineId/restore", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await restoreVisitDiagnosis(
    signedIn(c).repos,
    c.req.param("id"),
    c.req.param("lineId"),
    body,
  );
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ diagnosis: result.diagnosis }));
});

staffVisits.patch("/visits/:id/procedures/:lineId", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await updateVisitProcedure(
    signedIn(c).repos,
    c.req.param("id"),
    c.req.param("lineId"),
    body,
  );
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ procedure: result.procedure }));
});

staffVisits.delete("/visits/:id/procedures/:lineId", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await removeVisitProcedure(
    signedIn(c).repos,
    c.req.param("id"),
    c.req.param("lineId"),
    body,
  );
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ version: result.version }));
});

staffVisits.post("/visits/:id/procedures/:lineId/restore", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await restoreVisitProcedure(
    signedIn(c).repos,
    c.req.param("id"),
    c.req.param("lineId"),
    body,
  );
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ procedure: result.procedure }));
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
