import { ensureDevUser } from "@clinic/db/dev";
import { fail } from "@clinic/shared";
import type { Handler } from "hono";
import { setCookie } from "hono/cookie";
import { SESSION_ABSOLUTE_MS } from "../domain/auth";
import { openSession } from "../domain/login";
import { COOKIE_BASE } from "../http";
import { SESSION_COOKIE } from "../public-routes";
import type { AppEnv } from "../types";

// LOCAL DEVELOPMENT ONLY. This file is reachable only from src/dev/dev-entry.ts, the entry of the
// top-level (local) wrangler config. Staging/production bundles start at src/index.ts and never
// contain it (guarded by dev-guard.test.ts). It also refuses anything but localhost + dev-stub mode.
export const DEV_LOGIN_PATH = "/api/staff/auth/dev-login";

export const devLogin: Handler<AppEnv> = async (c) => {
  const host = new URL(c.req.url).hostname;
  if (c.env.AUTH_MODE !== "dev-stub" || (host !== "localhost" && host !== "127.0.0.1")) {
    return c.json(fail("not_found", "This address does not exist."), 404);
  }
  const role = c.req.query("role") === "receptionist" ? "receptionist" : "doctor";
  const user = await ensureDevUser(c.var.db, role);
  const token = await openSession(
    c.var.db,
    user,
    null,
    { userAgent: "dev-login", requestId: c.var.requestId },
    Date.now(),
  );
  setCookie(c, SESSION_COOKIE, token, { ...COOKIE_BASE, maxAge: SESSION_ABSOLUTE_MS / 1000 });
  return c.redirect("/app", 302);
};
