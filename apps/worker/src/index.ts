import { Hono } from "hono";
import { fail } from "@clinic/shared";
import { hooks } from "./routes/hooks";
import { portal } from "./routes/portal";
import { staff } from "./routes/staff";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

app.route("/api/staff", staff);
app.route("/api/portal", portal);
app.route("/hooks", hooks);

app.notFound((c) => {
  if (isApiPath(c.req.path)) {
    return c.json(fail("not_found", "This address does not exist."), 404);
  }
  return c.env.ASSETS.fetch(c.req.raw);
});

app.onError((err, c) => {
  // Error messages can contain request data, so log only the error type.
  console.error("unhandled error:", err.name);
  return c.json(
    fail(
      "server_error",
      "Something went wrong. Please try again. If it keeps happening, tell the developer.",
    ),
    500,
  );
});

function isApiPath(path: string): boolean {
  return path.startsWith("/api/") || path.startsWith("/hooks/");
}

export default app;
