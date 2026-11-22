import { fail, ok } from "@clinic/shared";
import { Hono } from "hono";
import {
  copyPreviousPrescription,
  createPrescription,
  getPrescription,
  issuePrescription,
  listVisitPrescriptions,
  patchPrescription,
  replacePrescriptionItems,
  revisePrescription,
} from "../domain/prescriptions";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

export const staffPrescriptions = new Hono<AppEnv>();

// 4.2.x prescription API. Permissions enforced in repos (write vs print).
staffPrescriptions.post("/prescriptions", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await createPrescription(signedIn(c).repos, body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ prescription: result.prescription }), 201);
});

staffPrescriptions.get("/prescriptions/:id", async (c) => {
  const result = await getPrescription(signedIn(c).repos, c.req.param("id"));
  return c.json(ok({ prescription: result.prescription }));
});

staffPrescriptions.get("/visits/:id/prescriptions", async (c) => {
  const result = await listVisitPrescriptions(signedIn(c).repos, c.req.param("id"));
  return c.json(ok({ prescriptions: result.prescriptions }));
});

staffPrescriptions.put("/prescriptions/:id/items", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await replacePrescriptionItems(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ prescription: result.prescription }));
});

staffPrescriptions.patch("/prescriptions/:id", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await patchPrescription(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ prescription: result.prescription }));
});

staffPrescriptions.post("/prescriptions/:id/issue", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await issuePrescription(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ prescription: result.prescription }));
});

staffPrescriptions.post("/prescriptions/:id/revise", async (c) => {
  const result = await revisePrescription(signedIn(c).repos, c.req.param("id"));
  return c.json(ok({ prescription: result.prescription }), 201);
});

staffPrescriptions.post("/prescriptions/copy-previous", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await copyPreviousPrescription(signedIn(c).repos, body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ prescription: result.prescription }), 201);
});
