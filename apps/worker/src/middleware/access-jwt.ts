import { fail } from "@clinic/shared";
import type { MiddlewareHandler } from "hono";
import { verifyWithJwks } from "../adapters/jwks";
import { checkStandardClaims } from "../domain/jwt";
import type { AppEnv } from "../types";

// Optional outer layer (task 1.3.1, waiting on a card). Off while ACCESS_AUD or ACCESS_TEAM_DOMAIN
// is empty; switching Access on is config only. Trust the header, never the CF_Authorization cookie.
const BYPASSED = new Set(["/api/staff/health"]);

export function accessJwt(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const audience = c.env.ACCESS_AUD;
    const team = c.env.ACCESS_TEAM_DOMAIN;
    if (!audience || !team || BYPASSED.has(c.req.path)) return next();

    const token = c.req.header("Cf-Access-Jwt-Assertion");
    const issuer = `https://${team}`;
    const result = token
      ? await verifyWithJwks(token, `${issuer}/cdn-cgi/access/certs`)
      : ({ ok: false } as const);
    const nowSec = Math.floor(Date.now() / 1000);
    if (
      !result.ok ||
      checkStandardClaims(result.payload, { issuers: [issuer], audience, nowSec })
    ) {
      return c.json(
        fail(
          "access_denied",
          "The clinic sign-in check failed. Reload the page and sign in again.",
        ),
        403,
      );
    }
    return next();
  };
}
