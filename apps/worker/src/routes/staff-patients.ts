import { fail, ok } from "@clinic/shared";
import { Hono } from "hono";
import { checkPatientDuplicates, listPatients } from "../domain/patients";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

// GET /api/staff/patients — page of patients for the Patients screen (S02 / S15).
// POST /api/staff/patients/duplicate-check — soft duplicate warnings (2.1.7).
export const staffPatients = new Hono<AppEnv>();

staffPatients.get("/patients", async (c) => {
  const page = await listPatients(signedIn(c).repos, new URL(c.req.url).searchParams);
  return c.json(ok({ page }));
});

staffPatients.post("/patients/duplicate-check", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await checkPatientDuplicates(signedIn(c).repos, body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ warnings: result.warnings }));
});
