import { ERROR_REPORT_MAX_BYTES, fail, ok } from "@clinic/shared";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { buildVersion } from "../domain/health";
import { listErrors, reportBrowserError } from "../domain/error-log";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

export const staffErrors = new Hono<AppEnv>();

// Any signed-in staff user may report (rate limited per user in the repo; body size capped).
staffErrors.post(
  "/errors",
  bodyLimit({
    maxSize: ERROR_REPORT_MAX_BYTES,
    onError: (c) => c.json(fail("too_large", "That error report was too large."), 413),
  }),
  async (c) => {
    const body = await c.req.json().catch(() => null);
    const version = buildVersion(c.env.CF_VERSION_METADATA);
    const result = await reportBrowserError(signedIn(c).repos, body, version);
    if (!result.ok) return c.json(fail("invalid", result.message), result.status);
    return c.json(ok({ stored: true }), 201);
  },
);

// Doctor only (the repo checks), read only, newest first.
staffErrors.get("/errors", async (c) => {
  const result = await listErrors(signedIn(c).repos);
  return c.json(ok({ errors: result.errors }));
});
