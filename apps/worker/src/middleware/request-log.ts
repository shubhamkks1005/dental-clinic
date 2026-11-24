import { serverTimingValue, timeD1 } from "@clinic/db";
import type { MiddlewareHandler } from "hono";
import { requestPath, writeLog } from "../log";
import type { AppEnv } from "../types";

// One JSON line per /api or /hooks request (method, path, status, ms, requestId). Runs in
// finally so a crash still leaves a request line that shares the Error ID with the error log.
// /api replies also carry Server-Timing (S0.1.1): total ms, DB ms, D1 round trips and statements. Numbers only.
export function requestLog(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const started = Date.now();
    const { d1, timer } = timeD1(c.env.DB);
    // A copy for this request only: other requests in the same isolate keep their own counters.
    c.env = { ...c.env, DB: d1 };
    let failed = false;
    try {
      await next();
      if (requestPath(c.req.url).startsWith("/api/")) {
        c.res.headers.set("Server-Timing", serverTimingValue(Date.now() - started, timer));
      }
    } catch (err) {
      failed = true;
      throw err;
    } finally {
      writeLog("info", {
        msg: "request",
        requestId: c.var.requestId,
        method: c.req.method,
        path: requestPath(c.req.url),
        status: failed ? 500 : c.res.status,
        ms: Date.now() - started,
        ...(c.var.ctx?.role ? { role: c.var.ctx.role } : {}),
      });
    }
  };
}
