import type { MiddlewareHandler } from "hono";
import { requestPath, writeLog } from "../log";
import type { AppEnv } from "../types";

// One JSON line per /api or /hooks request (method, path, status, ms, requestId). Runs in
// finally so a crash still leaves a request line that shares the Error ID with the error log.
export function requestLog(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const started = Date.now();
    let failed = false;
    try {
      await next();
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
