import { fail, ok } from "@clinic/shared";
import { Hono } from "hono";
import {
  answerApproval,
  createApproval,
  dismissApproval,
  listApprovals,
  withdrawApproval,
} from "../domain/approvals";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

export const staffApprovals = new Hono<AppEnv>();

staffApprovals.get("/approvals", async (c) => {
  const { repos, ctx } = signedIn(c);
  return c.json(ok({ approvals: await listApprovals(repos, ctx.role) }));
});

staffApprovals.post("/approvals", async (c) => {
  const result = await createApproval(signedIn(c).repos, await c.req.json().catch(() => null));
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ id: result.id }), 201);
});

staffApprovals.post("/approvals/:id/answer", async (c) => {
  const body = await c.req.json().catch(() => null);
  const result = await answerApproval(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ answer: result.answer }));
});

staffApprovals.post("/approvals/:id/dismiss", async (c) => {
  const body = await c.req.json().catch(() => null);
  const result = await dismissApproval(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ answer: result.answer }));
});

staffApprovals.post("/approvals/:id/withdraw", async (c) => {
  await withdrawApproval(signedIn(c).repos, c.req.param("id"));
  return c.json(ok({ withdrawn: true }));
});
