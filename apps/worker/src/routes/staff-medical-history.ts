import { fail, ok } from "@clinic/shared";
import { Hono } from "hono";
import { getAlertFlags, getMedicalHistory, saveMedicalHistory } from "../domain/medical-history";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

export const staffMedicalHistory = new Hono<AppEnv>();

// 3.3.1 / 3.2.7: clinical.view/edit for full history; clinical.alert_flag for receptionist icons.
staffMedicalHistory.get("/patients/:id/medical-history", async (c) => {
  const result = await getMedicalHistory(signedIn(c).repos, c.req.param("id"));
  return c.json(
    ok({
      history: result.history,
      alerts: result.alerts,
      stale: result.stale,
      staleMonths: result.staleMonths,
    }),
  );
});

staffMedicalHistory.post("/patients/:id/medical-history", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await saveMedicalHistory(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ history: result.history, alerts: result.alerts }), 201);
});

staffMedicalHistory.get("/patients/:id/alert-flags", async (c) => {
  const result = await getAlertFlags(signedIn(c).repos, c.req.param("id"));
  return c.json(ok({ flags: result.flags }));
});
