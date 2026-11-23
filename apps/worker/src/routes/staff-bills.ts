import { fail, istDate, ok } from "@clinic/shared";
import { Hono } from "hono";
import {
  approveBillDiscount,
  cancelBill,
  closeDay,
  createBill,
  createBillFromVisit,
  dayCloseSummary,
  getBill,
  getPayment,
  issueBill,
  listDues,
  listPatientBills,
  listPatientPayments,
  recordDuesCall,
  recordPayment,
  recordRefund,
  reopenDay,
  requestBillDiscount,
} from "../domain/bills";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

export const staffBills = new Hono<AppEnv>();

// 5.3.x billing. Permissions enforced in repos (bills.create / bills.adjust).
staffBills.get("/bills/dues", async (c) => {
  const result = await listDues(signedIn(c).repos);
  return c.json(
    ok({
      rows: result.rows,
      totalDuePaise: result.totalDuePaise,
      byBucket: result.byBucket,
    }),
  );
});

staffBills.post("/patients/:id/dues-calls", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await recordDuesCall(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ call: result.call }), 201);
});

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

staffBills.post("/bills/:id/discount", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await requestBillDiscount(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ bill: result.bill }));
});

staffBills.post("/bills/:id/discount/approve", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await approveBillDiscount(signedIn(c).repos, c.req.param("id"), body);
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

staffBills.get("/patients/:id/payments", async (c) => {
  const result = await listPatientPayments(signedIn(c).repos, c.req.param("id"));
  return c.json(ok({ payments: result.payments }));
});

staffBills.post("/payments", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await recordPayment(signedIn(c).repos, body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ payment: result.payment }), 201);
});

staffBills.get("/payments/:id", async (c) => {
  const result = await getPayment(signedIn(c).repos, c.req.param("id"));
  return c.json(ok({ payment: result.payment }));
});

staffBills.get("/day-close", async (c) => {
  const raw = c.req.query("date") ?? "";
  // Default today so permission is checked in the repo even without ?date= (route matrix).
  const day = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : istDate(new Date());
  const result = await dayCloseSummary(signedIn(c).repos, day);
  return c.json(ok({ summary: result.summary }));
});

staffBills.post("/day-close", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await closeDay(signedIn(c).repos, body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ summary: result.summary }), 201);
});

staffBills.post("/day-close/reopen", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await reopenDay(signedIn(c).repos, body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ summary: result.summary }));
});

staffBills.post("/refunds", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await recordRefund(signedIn(c).repos, body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ refund: result.refund }), 201);
});
