import { fail, ok } from "@clinic/shared";
import { Hono } from "hono";
import {
  closePatientRequest,
  createPatientRequest,
  getPatientRequest,
  listPatientRequests,
} from "../domain/patient-requests";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

export const staffPatientRequests = new Hono<AppEnv>();

staffPatientRequests.get("/patient-requests", async (c) => {
  const requests = await listPatientRequests(signedIn(c).repos, c.req.query("status"));
  return c.json(ok({ requests }));
});

staffPatientRequests.get("/patient-requests/:id", async (c) => {
  const request = await getPatientRequest(signedIn(c).repos, c.req.param("id"));
  return c.json(ok({ request }));
});

// Paper or phone intake by staff (the patient portal form comes with Phase 8).
staffPatientRequests.post("/patient-requests", async (c) => {
  const result = await createPatientRequest(
    signedIn(c).repos,
    await c.req.json().catch(() => null),
  );
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ id: result.id, dueOn: result.dueOn }), 201);
});

staffPatientRequests.post("/patient-requests/:id/close", async (c) => {
  const result = await closePatientRequest(
    signedIn(c).repos,
    c.req.param("id"),
    await c.req.json().catch(() => null),
  );
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ id: result.id, status: result.status }));
});
