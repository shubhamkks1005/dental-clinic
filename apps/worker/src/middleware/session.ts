import { createDb, createRepos } from "@clinic/db";
import { fail } from "@clinic/shared";
import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { currentSession } from "../domain/login";
import { SESSION_COOKIE } from "../public-routes";
import type { AppEnv } from "../types";

// Deny by default: every /api request needs a valid staff session unless its path is public.
export function requireStaff(publicPaths: ReadonlySet<string>): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const db = createDb(c.env.DB);
    const requestId = c.req.header("cf-ray") ?? crypto.randomUUID();
    c.set("db", db);
    c.set("requestId", requestId);
    if (publicPaths.has(c.req.path)) return next();

    const token = getCookie(c, SESSION_COOKIE, "host");
    const session = token ? await currentSession(db, token, Date.now()) : null;
    if (!session) {
      return c.json(
        fail(
          "not_signed_in",
          "You are not signed in, or your session ended. Please sign in again.",
        ),
        401,
      );
    }
    const ctx = { userId: session.user.id, role: session.user.role, requestId };
    c.set("session", session);
    c.set("ctx", ctx);
    c.set("repos", createRepos(db, ctx));
    return next();
  };
}
