import { fail, ok } from "@clinic/shared";
import { Hono } from "hono";
import { addPatientToothEvent, getPatientChart } from "../domain/chart";
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
