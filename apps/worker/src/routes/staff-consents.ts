import {
  CONSENT_METHODS,
  CONSENT_TYPES,
  fail,
  ok,
  type ConsentMethod,
  type ConsentType,
} from "@clinic/shared";
import { Hono } from "hono";
import { listPatientConsents, recordPatientConsent } from "../domain/consents";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

// 2.1.9 consents for one patient: history is append-only.
export const staffConsents = new Hono<AppEnv>();

staffConsents.get("/patients/:id/consents", async (c) => {
  const rows = await listPatientConsents(signedIn(c).repos, c.req.param("id"));
  return c.json(ok({ consents: rows }));
});

staffConsents.post("/patients/:id/consents", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const parsed = parseConsentBody(body);
  if (!parsed.ok) return c.json(fail("invalid", parsed.message), 400);
  const consents = await recordPatientConsent(signedIn(c).repos, c.req.param("id"), parsed.value);
  return c.json(ok({ consents }));
});

function parseConsentBody(body: unknown):
  | {
      ok: true;
      value: {
        type: ConsentType;
        noticeVersion: number;
        given: boolean;
        method: ConsentMethod;
        givenAt: string;
      };
    }
  | { ok: false; message: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, message: "Send the consent details as JSON." };
  }
  const b = body as Record<string, unknown>;
  const type = b.type;
  const method = b.method;
  if (typeof type !== "string" || !CONSENT_TYPES.includes(type as ConsentType)) {
    return { ok: false, message: "Pick a valid consent type." };
  }
  if (typeof method !== "string" || !CONSENT_METHODS.includes(method as ConsentMethod)) {
    return { ok: false, message: "Pick a valid consent method." };
  }
  const noticeVersion = Number(b.noticeVersion);
  if (!Number.isInteger(noticeVersion) || noticeVersion < 1) {
    return { ok: false, message: "Notice version must be a positive whole number." };
  }
  if (typeof b.given !== "boolean") {
    return { ok: false, message: "Say whether consent was given (true or false)." };
  }
  return {
    ok: true,
    value: {
      type: type as ConsentType,
      method: method as ConsentMethod,
      noticeVersion,
      given: b.given,
      givenAt: new Date().toISOString(),
    },
  };
}
