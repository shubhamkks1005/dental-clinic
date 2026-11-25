import { fail, ok } from "@clinic/shared";
import { Hono } from "hono";
import {
  addPatientToothEvent,
  addPatientToothEvents,
  getPatientChart,
  getToothHistory,
  saveToothNote,
} from "../domain/chart";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

export const staffChart = new Hono<AppEnv>();

// 3.4.5: tooth chart for a patient (current or as-of a finalised visit).
staffChart.get("/patients/:id/chart", async (c) => {
  const asOfVisitId = c.req.query("asOfVisitId") || null;
  const highlightVisitId = c.req.query("highlightVisitId") || null;
  const result = await getPatientChart(
    signedIn(c).repos,
    c.req.param("id"),
    asOfVisitId,
    highlightVisitId,
  );
  return c.json(ok({ chart: result.chart }));
});

staffChart.post("/patients/:id/chart/events", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await addPatientToothEvent(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ eventId: result.eventId, chart: result.chart }), 201);
});

// B9: a group of chart marks in one request (autosave and the Save button).
staffChart.post("/patients/:id/chart/events/batch", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await addPatientToothEvents(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ eventIds: result.eventIds, chart: result.chart }), 201);
});

// B10: what happened on one tooth (newest first, 20 per page, "Show older" by cursor).
staffChart.get("/patients/:id/teeth/:fdi/history", async (c) => {
  const result = await getToothHistory(
    signedIn(c).repos,
    c.req.param("id"),
    c.req.param("fdi"),
    c.req.query("before") || null,
  );
  return c.json(ok(result.history));
});

// B7: per-tooth clinical note (doctor only; draft visit only).
staffChart.put("/patients/:id/teeth/:fdi/note", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await saveToothNote(
    signedIn(c).repos,
    c.req.param("id"),
    c.req.param("fdi"),
    body,
  );
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ note: result.note }));
});
