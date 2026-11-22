import type { MiddlewareHandler } from "hono";
import { secureHeaders } from "hono/secure-headers";
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
    c.header("Cache-Control", "no-store");
  };
}
