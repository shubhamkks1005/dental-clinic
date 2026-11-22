import { fail } from "@clinic/shared";
import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types";

// Every state-changing /api call must come from our own page: same Origin and a custom header
// (a cross-site form or script cannot send it without a CORS preflight, which we never allow).
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
export const CSRF_HEADER = "x-clinic-request";

export function csrfGuard(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    if (SAFE_METHODS.has(c.req.method)) return next();
    const sameOrigin = c.env.APP_ORIGIN !== "" && c.req.header("origin") === c.env.APP_ORIGIN;
    if (!sameOrigin || c.req.header(CSRF_HEADER) !== "1") {
      return c.json(
        fail("blocked", "This request was blocked for safety. Reload the page and try again."),
        403,
      );
    }
    return next();
  };
}
