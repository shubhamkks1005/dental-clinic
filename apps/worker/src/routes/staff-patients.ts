import { fail, ok } from "@clinic/shared";
import { Hono } from "hono";
import {
  archivePatient,
  checkPatientDuplicates,
  createPatient,
  getPatient,
  listPatients,
  restorePatient,
} from "../domain/patients";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

// GET /patients — list (S02/S15). GET :id profile (2.2.2). POST create (2.2.1).
export const staffPatients = new Hono<AppEnv>();

staffPatients.get("/patients", async (c) => {
  const page = await listPatients(signedIn(c).repos, new URL(c.req.url).searchParams);
  return c.json(ok({ page }));
});

staffPatients.get("/patients/:id", async (c) => {
  const patient = await getPatient(signedIn(c).repos, c.req.param("id"));
  return c.json(ok({ patient }));
});

staffPatients.post("/patients", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await createPatient(signedIn(c).repos, body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ patient: result.patient }), 201);
});

staffPatients.post("/patients/duplicate-check", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await checkPatientDuplicates(signedIn(c).repos, body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ warnings: result.warnings }));
});

staffPatients.post("/patients/:id/archive", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await archivePatient(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ archived: true }));
});

staffPatients.post("/patients/:id/restore", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await restorePatient(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ restored: true }));
});
