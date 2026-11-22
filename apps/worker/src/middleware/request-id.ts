import { REQUEST_ID_HEADER } from "@clinic/shared";
import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types";

// One id per request (Cloudflare's cf-ray when present). It goes into audit and access rows,
// error logs, and the X-Request-Id reply header, which the staff app shows as the "Error ID".
export function requestId(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const id = c.req.header("cf-ray") ?? crypto.randomUUID();
    c.set("requestId", id);
    await next();
    c.header(REQUEST_ID_HEADER, id);
  };
}
