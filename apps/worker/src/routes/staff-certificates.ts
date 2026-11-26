import { fail, ok } from "@clinic/shared";
import { Hono } from "hono";
import {
  createCertificate,
  finaliseCertificate,
  getCertificate,
  listCertificateRegister,
  listPatientCertificates,
  patchCertificate,
  reviseCertificate,
} from "../domain/certificates";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

export const staffCertificates = new Hono<AppEnv>();

// 4.4.3 medical certificates. Write vs print enforced in repos.
staffCertificates.post("/certificates", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await createCertificate(signedIn(c).repos, body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ certificate: result.certificate }), 201);
});

staffCertificates.get("/certificates", async (c) => {
  const result = await listCertificateRegister(signedIn(c).repos);
  return c.json(ok({ certificates: result.certificates }));
});

staffCertificates.get("/certificates/:id", async (c) => {
  const result = await getCertificate(signedIn(c).repos, c.req.param("id"));
  return c.json(ok({ certificate: result.certificate, doctorProfile: result.doctorProfile }));
});

staffCertificates.get("/patients/:id/certificates", async (c) => {
  const result = await listPatientCertificates(signedIn(c).repos, c.req.param("id"));
  return c.json(ok({ certificates: result.certificates }));
});

staffCertificates.patch("/certificates/:id", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await patchCertificate(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ certificate: result.certificate }));
});

staffCertificates.post("/certificates/:id/finalise", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await finaliseCertificate(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ certificate: result.certificate }));
});

staffCertificates.post("/certificates/:id/revise", async (c) => {
  const result = await reviseCertificate(signedIn(c).repos, c.req.param("id"));
  return c.json(ok({ certificate: result.certificate }), 201);
});
