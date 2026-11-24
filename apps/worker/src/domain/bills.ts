import type { Repos } from "@clinic/db";
import {
  parseApproveBillDiscount,
  parseRejectBillDiscount,
  parseCloseDay,
  parseCreateBill,
  parseDuesCall,
  parseRecordPayment,
  parseRecordRefund,
  parseReopenDay,
  parseRequestBillDiscount,
  parseUpdateDraftBill,
  parseMonthParam,
  billingExportToCsv,
} from "@clinic/shared";

export async function createBill(repos: Repos, body: unknown) {
  const parsed = parseCreateBill(body);
  if (!parsed.ok) return { ok: false as const, message: parsed.message };
  const bill = await repos.bills.create(parsed.value);
  return { ok: true as const, bill };
}

export async function listDues(repos: Repos) {
  const data = await repos.bills.listDues();
  return { ok: true as const, ...data };
}

export async function recordDuesCall(repos: Repos, patientId: string, body: unknown) {
  const parsed = parseDuesCall(body);
  if (!parsed.ok) return { ok: false as const, message: parsed.message };
  const call = await repos.duesCalls.record(patientId, parsed.value);
  return { ok: true as const, call };
}

export async function getBill(repos: Repos, id: string) {
  const bill = await repos.bills.get(id);
  return { ok: true as const, bill };
}

export async function issueBill(repos: Repos, id: string, body: unknown) {
  const version =
    body && typeof body === "object" && "version" in body
      ? Number((body as { version: unknown }).version)
      : NaN;
  if (!Number.isInteger(version)) {
    return { ok: false as const, message: "Send the bill version to issue it." };
  }
  const applyAdvance =
    body && typeof body === "object" && "applyAdvance" in body
      ? Boolean((body as { applyAdvance: unknown }).applyAdvance)
      : false;
  const bill = await repos.bills.issue(id, version, { applyAdvance });
  return { ok: true as const, bill };
}

export async function cancelBill(repos: Repos, id: string, body: unknown) {
  const version =
    body && typeof body === "object" && "version" in body
      ? Number((body as { version: unknown }).version)
      : NaN;
  const reason =
    body && typeof body === "object" && "reason" in body
      ? String((body as { reason: unknown }).reason ?? "")
      : "";
  if (!Number.isInteger(version)) {
    return { ok: false as const, message: "Send the bill version to cancel it." };
  }
  const bill = await repos.bills.cancel(id, version, reason);
  return { ok: true as const, bill };
}

// D5: a bill from a finalised visit is issued at once (it gets its gap-free number then). Only
// "Review first" (reviewFirst: true) keeps it as a draft, so items or a discount can be changed.
// The draft and the issue are two writes; if the issue fails the draft stays and can be issued.
export async function createBillFromVisit(repos: Repos, visitId: string, body?: unknown) {
  const reviewFirst =
    !!body && typeof body === "object" && (body as { reviewFirst?: unknown }).reviewFirst === true;
  const draft = await repos.bills.createFromVisit(visitId);
  if (reviewFirst) return { ok: true as const, bill: draft };
  const account = await repos.bills.listForPatient(draft.patientId);
  const bill = await repos.bills.issue(draft.id, draft.version, {
    applyAdvance: account.advancePaise > 0,
  });
  return { ok: true as const, bill };
}

export async function updateDraftBill(repos: Repos, id: string, body: unknown) {
  const parsed = parseUpdateDraftBill(body);
  if (!parsed.ok) return { ok: false as const, message: parsed.message };
  const bill = await repos.bills.updateDraft(id, parsed.value);
  return { ok: true as const, bill };
}

export async function exportBillsMonth(repos: Repos, monthRaw: unknown) {
  // Permission before input parse so denied roles get 403, not 400.
  repos.bills.assertExportAllowed();
  const parsed = parseMonthParam(monthRaw);
  if (!parsed.ok) return { ok: false as const, message: parsed.message };
  const rows = await repos.bills.exportMonth(parsed.month);
  return { ok: true as const, month: parsed.month, csv: billingExportToCsv(rows), rows };
}

export async function listPatientBills(repos: Repos, patientId: string) {
  const data = await repos.bills.listForPatient(patientId);
  return { ok: true as const, ...data };
}

const BILL_STATUSES = ["draft", "issued", "cancelled"] as const;

// Billing hub, Bills tab. Bad query values fall back to the default instead of failing.
export async function searchBills(
  repos: Repos,
  query: { q?: string; status?: string; page?: string },
) {
  const status = BILL_STATUSES.find((s) => s === query.status);
  const page = Math.max(0, Math.floor(Number(query.page ?? 0)) || 0);
  const limit = 25;
  const result = await repos.bills.searchBills({
    q: query.q?.slice(0, 60),
    status,
    limit,
    offset: page * limit,
  });
  return { ok: true as const, ...result };
}

export async function listPatientPayments(repos: Repos, patientId: string) {
  const payments = await repos.payments.listForPatient(patientId);
  return { ok: true as const, payments };
}

export async function getPayment(repos: Repos, id: string) {
  const payment = await repos.payments.get(id);
  return { ok: true as const, payment };
}

export async function recordPayment(repos: Repos, body: unknown) {
  const parsed = parseRecordPayment(body);
  if (!parsed.ok) return { ok: false as const, message: parsed.message };
  const payment = await repos.payments.record(parsed.value);
  return { ok: true as const, payment };
}

export async function recordRefund(repos: Repos, body: unknown) {
  const parsed = parseRecordRefund(body);
  if (!parsed.ok) return { ok: false as const, message: parsed.message };
  const refund = await repos.refunds.record(parsed.value);
  return { ok: true as const, refund };
}

export async function requestBillDiscount(repos: Repos, id: string, body: unknown) {
  const parsed = parseRequestBillDiscount(body);
  if (!parsed.ok) return { ok: false as const, message: parsed.message };
  const bill = await repos.bills.requestDiscount(id, parsed.value);
  return { ok: true as const, bill };
}

export async function approveBillDiscount(repos: Repos, id: string, body: unknown) {
  const parsed = parseApproveBillDiscount(body);
  if (!parsed.ok) return { ok: false as const, message: parsed.message };
  const bill = await repos.bills.approveDiscount(id, parsed.value);
  return { ok: true as const, bill };
}

export async function rejectBillDiscount(repos: Repos, id: string, body: unknown) {
  const parsed = parseRejectBillDiscount(body);
  if (!parsed.ok) return { ok: false as const, message: parsed.message };
  const bill = await repos.bills.rejectDiscount(id, parsed.value);
  return { ok: true as const, bill };
}

export async function dayCloseSummary(repos: Repos, dayLocal: string) {
  const summary = await repos.dayClose.summary(dayLocal);
  return { ok: true as const, summary };
}

export async function closeDay(repos: Repos, body: unknown) {
  const parsed = parseCloseDay(body);
  if (!parsed.ok) return { ok: false as const, message: parsed.message };
  const summary = await repos.dayClose.close(parsed.value);
  return { ok: true as const, summary };
}

export async function reopenDay(repos: Repos, body: unknown) {
  const parsed = parseReopenDay(body);
  if (!parsed.ok) return { ok: false as const, message: parsed.message };
  const summary = await repos.dayClose.reopen(parsed.value);
  return { ok: true as const, summary };
}

/** Q1.7: discounts the receptionist asked for and the doctor has not approved yet. */
export async function listPendingDiscounts(repos: Repos) {
  return { ok: true as const, pending: await repos.bills.listPendingDiscounts() };
}

/** Q1.9 (D4): receptionist asks the doctor to cancel an issued bill. */
export async function requestBillCancelDomain(repos: Repos, billId: string, body: unknown) {
  const reason =
    typeof body === "object" &&
    body !== null &&
    typeof (body as { reason?: unknown }).reason === "string"
      ? (body as { reason: string }).reason
      : "";
  return { ok: true as const, ...(await repos.bills.requestCancel(billId, reason)) };
}

export async function listCancelRequestsDomain(repos: Repos) {
  return { ok: true as const, requests: await repos.bills.listOpenCancelRequests() };
}

export async function billCancelRequestDomain(repos: Repos, billId: string) {
  return { ok: true as const, request: await repos.bills.openCancelRequestFor(billId) };
}

export async function dismissCancelRequestDomain(repos: Repos, id: string) {
  await repos.bills.dismissCancelRequest(id);
  return { ok: true as const };
}
