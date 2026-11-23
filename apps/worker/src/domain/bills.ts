import type { Repos } from "@clinic/db";
import {
  parseCreateBill,
  parseDuesCall,
  parseRecordPayment,
  parseRecordRefund,
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
  const bill = await repos.bills.issue(id, version);
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

export async function createBillFromVisit(repos: Repos, visitId: string) {
  const bill = await repos.bills.createFromVisit(visitId);
  return { ok: true as const, bill };
}

export async function listPatientBills(repos: Repos, patientId: string) {
  const data = await repos.bills.listForPatient(patientId);
  return { ok: true as const, ...data };
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
