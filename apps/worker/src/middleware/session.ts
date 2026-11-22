import { createDb, createRepos } from "@clinic/db";
import { fail, SESSION_TIMED_OUT } from "@clinic/shared";
import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { currentSession } from "../domain/login";
import { SESSION_COOKIE } from "../public-routes";
import type { AppEnv } from "../types";

// Deny by default: every /api request needs a valid staff session unless its path is public.
export function requireStaff(publicPaths: ReadonlySet<string>): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const db = createDb(c.env.DB);
    const { requestId } = c.var;
    c.set("db", db);
    if (publicPaths.has(c.req.path)) return next();

    const token = getCookie(c, SESSION_COOKIE, "host");
    const current = token ? await currentSession(db, token, Date.now()) : null;
    if (!current?.ok) {
      return current?.timedOut
        ? c.json(fail(SESSION_TIMED_OUT, "You were signed out. Please sign in again."), 401)
        : c.json(
            fail(
              "not_signed_in",
              "You are not signed in, or your session ended. Please sign in again.",
            ),
            401,
          );
    }
    const { session } = current;
    const ctx = { userId: session.user.id, role: session.user.role, requestId };
    c.set("session", session);
    c.set("ctx", ctx);
    c.set("repos", createRepos(db, ctx));
    return next();
  };
}
