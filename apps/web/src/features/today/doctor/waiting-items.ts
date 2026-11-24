import type { ApprovalItem } from "@clinic/shared";
import { APPROVAL_TYPE_LABEL } from "@clinic/shared";
import { formatMoney } from "../../../ui/format";
import type { CancelRequest, PendingDiscount } from "../../billing";

// "Waiting for you": everything the doctor has to decide or finish, as one list (T2.7).
export type WaitingKind = "request" | "discount" | "prescription" | "draft" | "cancel" | "patient";

export type WaitingItem = {
  key: string;
  kind: WaitingKind;
  /** Badge text: "Urgent request", "Discount approval", ... */
  badge: string;
  tone: "error" | "warning" | "info" | "neutral";
  /** Right side of the head line: time or amount. */
  meta: string;
  who: string;
  patientCode: string | null;
  line: string;
  /** Yes / No (or Approve / Reject) buttons and a note field. */
  decision: { yes: string; no: string; placeholder: string } | null;
  /** A link button instead (Issue prescription, Finish draft, Open, View). */
  link: { to: string; label: string } | null;
  /** Can the doctor hide it with the X? Discounts cannot: they use Reject. */
  canDismiss: boolean;
  urgent: boolean;
  /** The original row, so the page can answer it. */
  approval?: ApprovalItem;
  discount?: PendingDiscount;
  cancel?: CancelRequest;
};

type Source = {
  approvals: readonly ApprovalItem[];
  discounts: readonly PendingDiscount[];
  cancels: readonly CancelRequest[];
  drafts: readonly { id: string; patientId: string; patientName: string; patientCode?: string }[];
  prescriptions: readonly {
    id: string;
    visitId: string | null;
    patientId: string;
    patientName: string;
    patientCode?: string;
  }[];
  requests: readonly { id: string; patientName: string; type: string; dueOn: string }[];
  hidden: ReadonlySet<string>;
  /** The patient in the chair: their own unfinished work is not "waiting". */
  exceptPatientId?: string;
  timeOf: (iso: string) => string;
};

const requestedBy = (a: ApprovalItem) =>
  a.requestedByName ? ` · Requested by ${a.requestedByName}` : "";

/** Urgent first, then requests, discounts, bill cancels, prescriptions, drafts, patient requests. */
export function buildWaitingItems(s: Source): WaitingItem[] {
  const items: WaitingItem[] = [];
  for (const a of s.approvals) {
    const label = APPROVAL_TYPE_LABEL[a.type];
    items.push({
      key: `a-${a.id}`,
      kind: "request",
      badge: a.urgent ? "Urgent request" : "Request",
      tone: a.urgent ? "error" : "info",
      meta: s.timeOf(a.createdAt),
      who: a.patientName ?? "Patient",
      patientCode: a.patientCode,
      line: `${label}${a.detail ? ` at ${a.detail}` : ""}${requestedBy(a)}${a.note ? ` · ${a.note}` : ""}`,
      decision: { yes: "Yes", no: "No", placeholder: "Add a note..." },
      link: null,
      canDismiss: true,
      urgent: a.urgent,
      approval: a,
    });
  }
  for (const d of s.discounts) {
    items.push({
      key: `d-${d.billId}`,
      kind: "discount",
      badge: "Discount approval",
      tone: "warning",
      meta: `${formatMoney(d.discountPaise)} off`,
      who: d.patientName,
      patientCode: null,
      line: `Billing discount${d.reason ? ` · ${d.reason.replace("_", " ")}` : ""}`,
      decision: { yes: "Approve", no: "Reject", placeholder: "Add a note (optional)..." },
      link: null,
      canDismiss: false,
      urgent: false,
      discount: d,
    });
  }
  for (const c of s.cancels) {
    items.push({
      key: `c-${c.id}`,
      kind: "cancel",
      badge: "Bill cancel asked",
      tone: "error",
      meta: c.billNo ? `Bill ${c.billNo}` : "Bill",
      who: c.patientName,
      patientCode: null,
      line: c.reason,
      decision: null,
      link: { to: `/app/bills/${c.billId}`, label: "Open" },
      canDismiss: true,
      urgent: false,
      cancel: c,
    });
  }
  const mine = (id: string) => id !== s.exceptPatientId;
  for (const r of s.prescriptions.filter((x) => x.visitId && mine(x.patientId))) {
    items.push({
      key: `rx-${r.id}`,
      kind: "prescription",
      badge: "Prescription",
      tone: "info",
      meta: "Today",
      who: r.patientName,
      patientCode: r.patientCode ?? null,
      line: "Prescription written, pending issue",
      decision: null,
      link: { to: `/app/visits/${r.visitId}`, label: "Issue prescription" },
      canDismiss: true,
      urgent: false,
    });
  }
  for (const v of s.drafts.filter((x) => mine(x.patientId))) {
    items.push({
      key: `v-${v.id}`,
      kind: "draft",
      badge: "Visit draft",
      tone: "neutral",
      meta: "Draft",
      who: v.patientName,
      patientCode: v.patientCode ?? null,
      line: "Visit notes drafted, not signed",
      decision: null,
      link: { to: `/app/visits/${v.id}`, label: "Finish draft" },
      canDismiss: true,
      urgent: false,
    });
  }
  for (const r of s.requests) {
    items.push({
      key: `r-${r.id}`,
      kind: "patient",
      badge: "Patient request",
      tone: "info",
      meta: `Due ${r.dueOn}`,
      who: r.patientName,
      patientCode: null,
      line: r.type.replaceAll("_", " "),
      decision: null,
      link: { to: "/app/requests", label: "View" },
      canDismiss: false,
      urgent: false,
    });
  }
  return items
    .filter((i) => !s.hidden.has(i.key))
    .sort((a, b) => Number(b.urgent) - Number(a.urgent));
}
