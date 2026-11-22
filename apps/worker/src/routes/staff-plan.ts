import { fail, ok } from "@clinic/shared";
import { Hono } from "hono";
import {
  changePlanEstimate,
  createPlanItem,
  listPlanItems,
  setPlanDecision,
} from "../domain/plan-items";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

export const staffPlan = new Hono<AppEnv>();

// 3.6.1–3.6.2 / 3.6.5: treatment plan API (clinical.view / clinical.edit in repo).
staffPlan.get("/patients/:id/plan-items", async (c) => {
  const result = await listPlanItems(signedIn(c).repos, c.req.param("id"));
  return c.json(ok({ items: result.items }));
});

staffPlan.post("/plan-items", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await createPlanItem(signedIn(c).repos, body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ item: result.item }), 201);
});

staffPlan.patch("/plan-items/:id/estimate", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await changePlanEstimate(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ item: result.item }));
});

staffPlan.patch("/plan-items/:id/decision", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await setPlanDecision(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ item: result.item }));
});
