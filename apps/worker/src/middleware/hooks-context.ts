import { createDb, createRepos } from "@clinic/db";
import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types";

/** Hooks are unsigned until each route checks its own secret; still need db + system repos. */
export function hooksContext(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const db = createDb(c.env.DB);
    const ctx = { userId: "system", role: "doctor" as const, requestId: c.var.requestId };
    c.set("db", db);
    c.set("ctx", ctx);
    c.set("repos", createRepos(db, ctx));
    return next();
  };
}
