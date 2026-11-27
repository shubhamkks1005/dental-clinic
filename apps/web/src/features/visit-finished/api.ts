import type { BillStateWord, ExtraPaidChoice } from "@clinic/shared";
import { api } from "../../api/client";
import type { BillDto } from "../billing/api";

// Visit finished page: the calls it makes (backend handoff docs/design/handoff/visit-finished.md).

export type VisitAfterDto = {
  visit: {
    id: string;
    patientId: string;
    doctorId: string;
    status: string;
    visitDateLocal: string;
    finalisedAt: string | null;
    version: number;
  };
  consultationFeePaise: number;
  arrival: {
    totalPaise: number;
    items: {
      paymentId: string;
      amountPaise: number;
      unallocatedPaise: number;
      mode: string;
      reference: string;
      notes: string;
      receivedAt: string;
      receivedByName: string;
    }[];
  };
  diagnoses: { id: string; label: string; toothFdi: number | null }[];
  procedures: { id: string; label: string; toothFdi: number | null; surfaces: string[] }[];
  nextAppointment: {
    id: string;
    dateLocal: string;
    startMin: number;
    visitTypeLabel: string;
  } | null;
  openPlanItems: {
    id: string;
    toothFdi: number | null;
    procedureLabel: string;
    status: string;
    sittings: number;
    sittingsDone: number;
  }[];
  followUpOn: string | null;
  filesAdded: {
    id: string;
    kind: string;
    originalFilename: string;
    toothFdi: number | null;
    createdAt: string;
  }[];
  earlierDuesPaise: number;
  bill: { id: string; version: number; status: string; billNo: string | null } | null;
  billState: BillStateWord;
};

const enc = encodeURIComponent;

export function getVisitAfter(visitId: string) {
  return api<VisitAfterDto>(`/api/staff/visits/${enc(visitId)}/after`);
}

/** Makes the draft (or returns the live one). With `consultation` the Consultation line is added. */
export function startInvoice(visitId: string, consultationPaise?: number) {
  const body =
    consultationPaise === undefined
      ? { reviewFirst: true }
      : { reviewFirst: true, consultation: true, consultationPaise };
  return api<{ bill: BillDto }>(`/api/staff/visits/${enc(visitId)}/bill`, {
    method: "POST",
    body,
  }).then((r) => r.bill);
}

export function lockInvoice(id: string, version: number, extra: ExtraPaidChoice | null) {
  return api<{ bill: BillDto; refundError: string | null }>(`/api/staff/bills/${enc(id)}/lock`, {
    method: "POST",
    body: { version, extra },
  });
}

export function applyDiscount(
  id: string,
  input: { version: number; discountPaise: number; reason: string },
) {
  return api<{ bill: BillDto }>(`/api/staff/bills/${enc(id)}/discount/apply`, {
    method: "POST",
    body: input,
  }).then((r) => r.bill);
}

export function saveInvoiceNote(id: string, version: number, note: string) {
  return api<{ bill: BillDto }>(`/api/staff/bills/${enc(id)}/note`, {
    method: "PATCH",
    body: { version, note },
  }).then((r) => r.bill);
}

export function passRxToDesk(prescriptionId: string) {
  return api<{ requestedAt: string }>(
    `/api/staff/prescriptions/${enc(prescriptionId)}/desk-print`,
    {
      method: "POST",
      body: {},
    },
  );
}

export function payOnInvoice(input: {
  patientId: string;
  billId: string;
  amountPaise: number;
  mode: string;
  reference: string;
}) {
  return api<{ payment: { id: string; receiptNo: string | null } }>("/api/staff/payments", {
    method: "POST",
    body: {
      patientId: input.patientId,
      amountPaise: input.amountPaise,
      mode: input.mode,
      reference: input.reference,
      allocations: [{ billId: input.billId, amountPaise: input.amountPaise }],
    },
  }).then((r) => r.payment);
}
