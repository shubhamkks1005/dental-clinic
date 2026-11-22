import { ok } from "@clinic/shared";
import { Hono } from "hono";
import { listPatients } from "../domain/patients";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

// GET /api/staff/patients — page of patients for the Patients screen (S02 / S15).
export const staffPatients = new Hono<AppEnv>();

staffPatients.get("/patients", async (c) => {
  const page = await listPatients(signedIn(c).repos, new URL(c.req.url).searchParams);
  return c.json(ok({ page }));
});
