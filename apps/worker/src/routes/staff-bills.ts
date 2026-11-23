import { fail, ok } from "@clinic/shared";
import { Hono } from "hono";
import {
  cancelBill,
  createBill,
  createBillFromVisit,
  getBill,
  issueBill,
  listPatientBills,
  recordPayment,
  recordRefund,
} from "../domain/bills";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

export const staffBills = new Hono<AppEnv>();

// 5.3.x billing. Permissions enforced in repos (bills.create / bills.adjust).
staffBills.post("/bills", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await createBill(signedIn(c).repos, body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ bill: result.bill }), 201);
});

staffBills.get("/bills/:id", async (c) => {
  const result = await getBill(signedIn(c).repos, c.req.param("id"));
  return c.json(ok({ bill: result.bill }));
});

staffBills.post("/bills/:id/issue", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await issueBill(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ bill: result.bill }));
});

staffBills.post("/bills/:id/cancel", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await cancelBill(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ bill: result.bill }));
});

staffBills.post("/visits/:id/bill", async (c) => {
  const result = await createBillFromVisit(signedIn(c).repos, c.req.param("id"));
  return c.json(ok({ bill: result.bill }), 201);
});

staffBills.get("/patients/:id/bills", async (c) => {
  const result = await listPatientBills(signedIn(c).repos, c.req.param("id"));
  return c.json(
    ok({
      bills: result.bills,
      outstandingDuePaise: result.outstandingDuePaise,
      advancePaise: result.advancePaise,
    }),
  );
});

staffBills.post("/payments", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await recordPayment(signedIn(c).repos, body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ payment: result.payment }), 201);
});

staffBills.post("/refunds", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await recordRefund(signedIn(c).repos, body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ refund: result.refund }), 201);
});
