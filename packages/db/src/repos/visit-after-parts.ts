import type { BillStateWord } from "@clinic/shared";

// Shape of GET /visits/:id/after and its small parsers (split from visit-after.ts).
export type VisitAfter = {
  visit: {
    id: string;
    patientId: string;
    doctorId: string;
    status: string;
    visitDateLocal: string;
    finalisedAt: string | null;
    version: number;
  };
  /** Usual consultation fee (setting billing.consultation_fee_paise); 0 = not set. */
  consultationFeePaise: number;
  /** Paid on the visit day and not yet used on any bill ("Paid at arrival"); notes say what for. */
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
  /** Names only, no fees (owner decision): the money is in `bill`. */
  diagnoses: { id: string; label: string; toothFdi: number | null }[];
  procedures: { id: string; label: string; toothFdi: number | null; surfaces: string[] }[];
  nextAppointment: {
    id: string;
    dateLocal: string;
    startMin: number;
    visitTypeLabel: string;
  } | null;
  /** Plan items still open, "left" = sittings - sittingsDone. */
  openPlanItems: {
    id: string;
    toothFdi: number | null;
    procedureLabel: string;
    status: string;
    sittings: number;
    sittingsDone: number;
  }[];
  /** Follow-up date written on the prescription of THIS visit (latest issued one). */
  followUpOn: string | null;
  /** Files added since this visit was opened. */
  filesAdded: {
    id: string;
    kind: string;
    originalFilename: string;
    toothFdi: number | null;
    createdAt: string;
  }[];
  /** Dues of the patient's OTHER bills (what was owed before this visit), in paise. */
  earlierDuesPaise: number;
  /** The visit's live bill, or null. `state` is the one rule from packages/shared/bill-state.ts. */
  bill: {
    id: string;
    version: number;
    status: string;
    billNo: string | null;
    totalPaise: number;
    discountPaise: number;
    discountApproved: boolean;
    notes: string;
    paidPaise: number;
    duePaise: number;
  } | null;
  billState: BillStateWord;
};

export function parseFee(json: string | null): number {
  if (!json) return 0;
  try {
    const v: unknown = JSON.parse(json);
    return typeof v === "number" && Number.isInteger(v) && v > 0 ? v : 0;
  } catch {
    return 0;
  }
}

type ArrivalRow = {
  paymentId: string;
  amountPaise: number;
  mode: string;
  reference: string;
  notes: string;
  receivedAt: string;
  receivedByName: string;
  allocated: number;
  refunded: number;
};

/** Only payments that still have money not used on any bill count as "paid at arrival". */
export function arrivalOf(rows: ArrivalRow[]): VisitAfter["arrival"] {
  const items = rows
    .map((r) => ({
      paymentId: r.paymentId,
      amountPaise: r.amountPaise,
      unallocatedPaise: r.amountPaise - Number(r.allocated) - Number(r.refunded),
      mode: r.mode,
      reference: r.reference,
      notes: r.notes,
      receivedAt: r.receivedAt,
      receivedByName: r.receivedByName,
    }))
    .filter((r) => r.unallocatedPaise > 0);
  return { totalPaise: items.reduce((s, r) => s + r.unallocatedPaise, 0), items };
}
