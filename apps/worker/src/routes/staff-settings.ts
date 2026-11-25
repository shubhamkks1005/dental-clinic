import { fail, ok, parseRestoreSetting, parseVersionOnly } from "@clinic/shared";
import { Hono } from "hono";
import { listCounters } from "../domain/counters";
import {
  getQrImage,
  listSettings,
  restoreSetting,
  settingHistory,
  updateSetting,
} from "../domain/settings";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

// Settings store API (1.5.1). Read: settings.read; change: settings.write (doctor, developer).
// A value outside its rule is 400 with a plain sentence; a stale version is 409.
export const staffSettings = new Hono<AppEnv>();

staffSettings.get("/settings", async (c) =>
  c.json(ok({ settings: await listSettings(signedIn(c).repos) })),
);

/** The QR picture for the prescription (both roles print it; only the doctor changes it, with PUT /settings/clinic.qr_image). */
staffSettings.get("/clinic/qr", async (c) => c.json(ok(await getQrImage(signedIn(c).repos))));

/** 6.5.1: view-only number series (counters). */
staffSettings.get("/counters", async (c) =>
  c.json(ok({ counters: await listCounters(signedIn(c).repos) })),
);

/** 6.5.2: who/when/before for one setting key. */
staffSettings.get("/settings/:key/history", async (c) => {
  const key = c.req.param("key");
  return c.json(ok({ history: await settingHistory(signedIn(c).repos, key) }));
});

/** 6.5.2: restore the value from before that audit row (new version). */
staffSettings.post("/settings/:key/restore", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const parsed = parseRestoreSetting(body);
  if (!parsed.ok) return c.json(fail("invalid", parsed.message), 400);
  const key = c.req.param("key");
  const saved = await restoreSetting(
    signedIn(c).repos,
    key,
    parsed.value.auditId,
    parsed.value.version,
  );
  return c.json(ok({ key, ...saved }));
});

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
