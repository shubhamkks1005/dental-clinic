import type { DueAgeBucket } from "@clinic/shared";
import { api } from "../../api/client";

export type DuesRow = {
  patientId: string;
  patientCode: string;
  patientName: string;
  duePaise: number;
  oldestBillOn: string;
  daysOutstanding: number;
  bucket: DueAgeBucket;
  lastCallNote: string | null;
  lastCallOn: string | null;
};

export type DayCloseSummary = {
  dayLocal: string;
  modeTotals: Record<string, number>;
  cashExpectedPaise: number;
  digitalPaise: number;
  totalPaise: number;
  paymentCount: number;
  closed: boolean;
  incompleteAppointments: {
    id: string;
    patientId: string;
    patientName: string;
    status: string;
    startMin: number;
    visitTypeLabel: string;
  }[];
  close: {
    id: string;
    cashCountedPaise: number;
    differencePaise: number;
    note: string;
    closedBy: string;
    closedAt: string;
  } | null;
};

export function getDayClose(dayLocal: string) {
  return api<{ summary: DayCloseSummary }>(
    `/api/staff/day-close?date=${encodeURIComponent(dayLocal)}`,
  ).then((r) => r.summary);
}

export function closeDay(input: { dayLocal: string; cashCountedPaise: number; note?: string }) {
  return api<{ summary: DayCloseSummary }>("/api/staff/day-close", {
    method: "POST",
    body: input,
  }).then((r) => r.summary);
}

export function reopenDay(dayLocal: string, reason: string) {
  return api<{ summary: DayCloseSummary }>("/api/staff/day-close/reopen", {
    method: "POST",
    body: { dayLocal, reason },
  }).then((r) => r.summary);
}

export function listDues() {
  return api<{
    rows: DuesRow[];
    totalDuePaise: number;
    byBucket: Record<DueAgeBucket, number>;
  }>("/api/staff/bills/dues");
}

export function downloadBillsExport(month: string) {
  return api<{ month: string; csv: string }>(
    "/api/staff/bills/export?month=" + encodeURIComponent(month),
  );
}

export function recordDuesCall(patientId: string, note: string) {
  return api<{ call: { id: string; calledOn: string } }>(
    `/api/staff/patients/${encodeURIComponent(patientId)}/dues-calls`,
    { method: "POST", body: { note } },
  ).then((r) => r.call);
}

export type BillItemDto = {
  id: string;
  procedureLabel: string;
  toothFdi: number | null;
  qty: number;
  unitPaise: number;
  discountPaise: number;
  taxPaise: number;
  lineTotalPaise: number;
  listItemId: string | null;
  planItemId: string | null;
  visitProcedureId: string | null;
  feeChangeReason: string | null;
  listUnitPaise: number | null;
};

export type BillDto = {
  id: string;
  patientId: string;
  visitId: string | null;
  billNo: string | null;
  billOn: string;
  status: string;
  kind: string;
  subtotalPaise: number;
  discountPaise: number;
  discountReason: string | null;
  discountApprovedBy: string | null;
  taxPaise: number;
  roundOffPaise: number;
  totalPaise: number;
  notes: string;
  cancelReason: string | null;
  version: number;
  items: BillItemDto[];
  payments?: {
    paymentId: string;
    amountPaise: number;
    mode: string;
    receiptNo: string | null;
    dayLocal: string;
  }[];
};

export type PatientBillRow = {
  id: string;
  billNo: string | null;
  billOn: string;
  status: string;
  kind: string;
  totalPaise: number;
  duePaise: number;
};

export function getBill(id: string) {
  return api<{ bill: BillDto }>(`/api/staff/bills/${encodeURIComponent(id)}`).then((r) => r.bill);
}

export function listPatientBills(patientId: string) {
  return api<{
    bills: PatientBillRow[];
    outstandingDuePaise: number;
    advancePaise: number;
  }>(`/api/staff/patients/${encodeURIComponent(patientId)}/bills`);
}

export function createBillFromVisit(visitId: string) {
  return api<{ bill: BillDto }>(`/api/staff/visits/${encodeURIComponent(visitId)}/bill`, {
    method: "POST",
    body: {},
  }).then((r) => r.bill);
}

export function updateDraftBill(
  id: string,
  input: {
    version: number;
    items: {
      procedureLabel: string;
      toothFdi?: number | null;
      qty: number;
      unitPaise: number;
      listItemId?: string | null;
      planItemId?: string | null;
      visitProcedureId?: string | null;
      listUnitPaise?: number | null;
      feeChangeReason?: string | null;
    }[];
  },
) {
  return api<{ bill: BillDto }>(`/api/staff/bills/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: input,
  }).then((r) => r.bill);
}

export function issueBill(id: string, version: number, opts: { applyAdvance?: boolean } = {}) {
  return api<{ bill: BillDto }>(`/api/staff/bills/${encodeURIComponent(id)}/issue`, {
    method: "POST",
    body: { version, applyAdvance: opts.applyAdvance === true },
  }).then((r) => r.bill);
}

export function requestBillDiscount(
  id: string,
  input: { version: number; discountPaise: number; reason: string },
) {
  return api<{ bill: BillDto }>(`/api/staff/bills/${encodeURIComponent(id)}/discount`, {
    method: "POST",
    body: input,
  }).then((r) => r.bill);
}

export function approveBillDiscount(id: string, version: number) {
  return api<{ bill: BillDto }>(`/api/staff/bills/${encodeURIComponent(id)}/discount/approve`, {
    method: "POST",
    body: { version },
  }).then((r) => r.bill);
}

export type PatientPaymentRow = {
  id: string;
  amountPaise: number;
  mode: string;
  splitMode: string | null;
  splitPaise: number | null;
  reference: string;
  receiptNo: string | null;
  dayLocal: string;
  refundedPaise: number;
  refundablePaise: number;
  appliedTo: string[];
};

export function listPatientPayments(patientId: string) {
  return api<{ payments: PatientPaymentRow[] }>(
    `/api/staff/patients/${encodeURIComponent(patientId)}/payments`,
  ).then((r) => r.payments);
}

export function recordRefund(input: {
  paymentId: string;
  amountPaise: number;
  mode: string;
  reason: string;
}) {
  return api<{ refund: { id: string; refundNo: string | null } }>("/api/staff/refunds", {
    method: "POST",
    body: input,
  }).then((r) => r.refund);
}

export function cancelBill(id: string, version: number, reason: string) {
  return api<{ bill: BillDto }>(`/api/staff/bills/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    body: { version, reason },
  }).then((r) => r.bill);
}

export function recordPayment(input: {
  patientId: string;
  amountPaise: number;
  mode: string;
  reference?: string;
  splitMode?: string;
  splitPaise?: number;
  allowAdvance?: boolean;
}) {
  return api<{ payment: { id: string; receiptNo: string | null; advancePaise: number } }>(
    "/api/staff/payments",
    { method: "POST", body: input },
  ).then((r) => r.payment);
}

export type PendingDiscount = {
  billId: string;
  patientId: string;
  patientName: string;
  discountPaise: number;
  reason: string | null;
  version: number;
};

/** Q1.7: the doctor's "Waiting for you" discounts. */
export function listPendingDiscounts() {
  return api<{ pending: PendingDiscount[] }>("/api/staff/bills/pending-discounts").then(
    (r) => r.pending,
  );
}
