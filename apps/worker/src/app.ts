import { areaOf, fail, isWorkerArea } from "@clinic/shared";
import { Hono } from "hono";
import { errorReply } from "./errors";
import { accessJwt } from "./middleware/access-jwt";
import { csrfGuard } from "./middleware/csrf";
import { apiHeaders } from "./middleware/headers";
import { requireStaff } from "./middleware/session";
import { PUBLIC_API } from "./public-routes";
import { hooks } from "./routes/hooks";
import { portal } from "./routes/portal";
import { staff } from "./routes/staff";
import type { AppEnv } from "./types";

// extend/extraPublic exist only for src/dev/dev-entry.ts (local `wrangler dev`). Staging and
// production use src/index.ts, which calls createApp() with no options.
export type AppOptions = {
  extraPublic?: readonly string[];
  extend?: (app: Hono<AppEnv>) => void;
};

export function createApp(options: AppOptions = {}) {
  const app = new Hono<AppEnv>();
  const publicPaths = new Set<string>([...PUBLIC_API, ...(options.extraPublic ?? [])]);

  app.use("/api/*", apiHeaders());
  app.use("/hooks/*", apiHeaders());
  app.use("/api/*", csrfGuard());
  app.use("/api/staff/*", accessJwt());
  app.use("/api/*", requireStaff(publicPaths));
  options.extend?.(app);

  app.route("/api/staff", staff);
  app.route("/api/portal", portal);
  app.route("/hooks", hooks);

  app.notFound((c) => {
    if (isWorkerArea(areaOf(c.req.path))) {
      return c.json(fail("not_found", "This address does not exist."), 404);
    }
    return c.env.ASSETS.fetch(c.req.raw);
  });

  app.onError((err, c) => {
    const { status, body } = errorReply(err);
    // Error messages can contain request data, so log only the error type.
    if (status === 500) console.error("unhandled error:", err.name);
    return c.json(body, status);
  });

  return app;
}
