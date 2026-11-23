import type { MiddlewareHandler } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { DASHBOARD_CACHE_CONTROL } from "../domain/dashboard";
import type { AppEnv } from "../types";

// Security headers for Worker replies (/api, /hooks). Web pages get theirs from apps/web/public/_headers.
const secure = secureHeaders({
  contentSecurityPolicy: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
  strictTransportSecurity: "max-age=31536000; includeSubDomains",
  xFrameOptions: "DENY",
  referrerPolicy: "strict-origin-when-cross-origin",
  crossOriginResourcePolicy: "same-origin",
});

export function apiHeaders(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    await secure(c, next);
    // Replies can hold patient data: never keep them in a browser or proxy cache.
    // Exception: 6.3.1 dashboard is aggregates only (no names) — short private cache.
    const path = new URL(c.req.url).pathname;
    if (path === "/api/staff/dashboard") {
      c.header("Cache-Control", DASHBOARD_CACHE_CONTROL);
    } else {
      c.header("Cache-Control", "no-store");
    }
  };
}
