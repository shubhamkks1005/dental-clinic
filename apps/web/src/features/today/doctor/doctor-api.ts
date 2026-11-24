import type { ApprovalItem, CurrentBreak } from "@clinic/shared";
import { api } from "../../../api/client";

// Part T: the doctor's list moves, the break and the desk's requests. Components never fetch.
export type QueueMove = {
  id: string;
  version: number;
  status: string;
  queueOrder: number | null;
  steppedOutAt: string | null;
  skipCount: number;
  lateAt: string | null;
  other: { id: string; version: number; queueOrder: number } | null;
};

export type QueueAction = "skip" | "pull-forward" | "step-out" | "step-back" | "late";

export function moveAppointment(id: string, action: QueueAction, version: number) {
  return api<{ move: QueueMove }>(`/api/staff/appointments/${encodeURIComponent(id)}/${action}`, {
    method: "POST",
    body: { version },
  }).then((r) => r.move);
}

export function startBreak(minutes: number, label: string) {
  return api<{ current: CurrentBreak }>("/api/staff/breaks", {
    method: "POST",
    body: { minutes, label },
  }).then((r) => r.current);
}

export function adjustBreak(id: string, deltaMinutes: number, version: number) {
  return api<{ current: CurrentBreak }>(`/api/staff/breaks/${encodeURIComponent(id)}/adjust`, {
    method: "POST",
    body: { deltaMinutes, version },
  }).then((r) => r.current);
}

export function endBreak(id: string, version: number) {
  return api<{ ended: boolean }>(`/api/staff/breaks/${encodeURIComponent(id)}/end`, {
    method: "POST",
    body: { version },
  }).then(() => undefined);
}

export function listApprovals() {
  return api<{ approvals: ApprovalItem[] }>("/api/staff/approvals").then((r) => r.approvals);
}

export function answerApproval(
  id: string,
  decision: "approve" | "reject",
  note: string | undefined,
  version: number,
) {
  return api(`/api/staff/approvals/${encodeURIComponent(id)}/answer`, {
    method: "POST",
    body: { decision, note: note || undefined, version },
  }).then(() => undefined);
}

export function dismissApproval(id: string, version: number) {
  return api(`/api/staff/approvals/${encodeURIComponent(id)}/dismiss`, {
    method: "POST",
    body: { version },
  }).then(() => undefined);
}

export function withdrawApproval(id: string) {
  return api(`/api/staff/approvals/${encodeURIComponent(id)}/withdraw`, {
    method: "POST",
    body: {},
  }).then(() => undefined);
}

export function createApproval(body: {
  type: string;
  appointmentId: string;
  note: string;
  urgent: boolean;
  detail?: string;
}) {
  return api<{ id: string }>("/api/staff/approvals", { method: "POST", body });
}
