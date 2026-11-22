import { Hono } from "hono";
import { areaOf, fail, isWorkerArea } from "@clinic/shared";
import { errorReply } from "./errors";
import { accessJwt } from "./middleware/access-jwt";
import { hooks } from "./routes/hooks";
import { portal } from "./routes/portal";
import { staff } from "./routes/staff";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

app.use("/api/staff/*", accessJwt());
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

export default app;
