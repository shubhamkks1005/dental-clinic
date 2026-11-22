import { areaOf, fail, isWorkerArea } from "@clinic/shared";
import { Hono } from "hono";
import { errorReply } from "./errors";
import { writeLog } from "./log";
import { accessJwt } from "./middleware/access-jwt";
import { csrfGuard } from "./middleware/csrf";
import { apiHeaders } from "./middleware/headers";
import { requestId } from "./middleware/request-id";
import { requestLog } from "./middleware/request-log";
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

  app.use("/api/*", requestId());
  app.use("/hooks/*", requestId());
  app.use("/api/*", requestLog());
  app.use("/hooks/*", requestLog());
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
    // Never log the error message: it may hold request or patient data. Name + request id only.
    if (status === 500) {
      writeLog("error", {
        msg: "unhandled",
        requestId: c.var.requestId,
        err: err instanceof Error ? err.name : "unknown",
      });
    }
    return c.json(body, status);
  });

  return app;
}
