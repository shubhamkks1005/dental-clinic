import { fail, ok, parseVersionOnly } from "@clinic/shared";
import { Hono } from "hono";
import { listSettings, updateSetting } from "../domain/settings";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

// Settings store API (1.5.1). Read: settings.read; change: settings.write (doctor, developer).
// A value outside its rule is 400 with a plain sentence; a stale version is 409.
export const staffSettings = new Hono<AppEnv>();

staffSettings.get("/settings", async (c) =>
  c.json(ok({ settings: await listSettings(signedIn(c).repos) })),
);

staffSettings.put("/settings/:key", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const version = parseVersionOnly(body);
  if (!version.ok) return c.json(fail("invalid", version.message), 400);
  const value =
    typeof body === "object" && body !== null && "value" in body ? body.value : undefined;
  const key = c.req.param("key");
  const saved = await updateSetting(signedIn(c).repos, key, value, version.value.version);
  return c.json(ok({ key, ...saved }));
});
