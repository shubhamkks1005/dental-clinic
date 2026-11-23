import { fail, ok } from "@clinic/shared";
import { Hono } from "hono";
import { acceptOpsStatus } from "../domain/ops-status";
import type { AppEnv } from "../types";

// Every webhook must verify its signature before trusting the body.
export const hooks = new Hono<AppEnv>();

/** 9.1.10: GitHub Actions / Healthchecks-side reporter. Header x-clinic-ops-signature. */
hooks.post("/ops-status", async (c) => {
  const raw = await c.req.text();
  const sig = c.req.header("x-clinic-ops-signature") ?? null;
  const result = await acceptOpsStatus(c.var.repos!, c.env.OPS_WEBHOOK_SECRET, raw, sig);
  if (!result.ok) {
    return c.json(fail("unauthorized", result.message), result.status);
  }
  return c.json(ok({ key: result.data.key, status: result.data.status }));
});
