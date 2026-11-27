import {
  APPOINTMENT_STATUS_LABEL,
  appointmentStatusTone,
  displayMobile,
  emptySlotStarts,
  formatWaiting,
  istMinutes,
  sortWaitingQueue,
  formatClockTime,
  type DayWindow,
} from "@clinic/shared";
import type { StatusTone } from "../../ui/StatusBadge";
import type { DayAppointment } from "../appointments";
import { primaryRowAction, statusActionButtons, type RowPrimary } from "./statusActions";

export type TodayListRow = {
  id: string;
  patientId: string;
  visitTypeId: string;
  time: string;
  name: string;
  patientCode: string;
  visit: string;
  tone: StatusTone;
  statusLabel: string;
  noMobile: boolean;
  priority: "normal" | "emergency";
  hasAlert: boolean;
  hasRestrictedAlert: boolean;
  hasDue: boolean;
  duePaise: number | null;
  /** Visit finished: the doctor passed this prescription to the desk to print (desk only). */
  rxToPrintId: string | null;
  /** Q1.2: where "Take payment" goes (bill if one exists, else the patient's Billing tab); null = not ready. */
  payLink: string | null;
  /** Raw appointment status (statusLabel can say "Waiting 5 min"). */
  status: DayAppointment["status"];
  /** The one main button of the row (Q2.5). */
  primary: RowPrimary | null;
  version: number;
  startAt: string;
  updatedAt: string;
  highlighted: boolean;
};

export type TodayModel = {
  appointmentsCount: number;
  openSlots: number;
  /** Waiting = arrived and not yet in the chair. */
  waitingCount: number;
  inChairCount: number;
  inChairName: string | null;
  /** Total still to collect on the ready-to-bill rows; null when a row has no amount. */
  readyToBillPaise: number | null;
  /** Q1.2: finalised visits not yet fully paid (receptionist). */
  readyToBillCount: number;
  longestWaitMin: number | null;
  next: {
    id: string;
    name: string;
    patientNo: string;
    visit: string;
    mobile: string;
    /** "Waiting 12 min" */
    waiting: string | null;
    version: number;
    status: DayAppointment["status"];
    startAt: string;
    updatedAt: string;
    hasAlert: boolean;
    hasRestrictedAlert: boolean;
  } | null;
  rows: TodayListRow[];
  /** Missed today: the desk rebooks them. */
  callList: {
    id: string;
    patientId: string;
    visitTypeId: string;
    initials: string;
    name: string;
    note: string;
    mobile: string | null;
  }[];
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (a + b).toUpperCase();
}

function payLink(a: DayAppointment): string | null {
  if (!a.readyToBill) return null;
  return a.readyToBill.billId
    ? `/app/bills/${a.readyToBill.billId}`
    : `/app/patients/${a.patientId}?tab=billing`;
}

function toRow(a: DayAppointment, now: Date, highlighted: boolean): TodayListRow {
  const waiting = a.status === "arrived" ? formatWaiting(a.arrivedAt, now) : null;
  return {
    id: a.id,
    patientId: a.patientId,
    visitTypeId: a.visitTypeId,
    time: formatClockTime(a.startMin),
    name: a.patientName,
    patientCode: a.patientCode,
    visit: `${a.visitTypeLabel} · ${a.endMin - a.startMin} min`,
    tone: appointmentStatusTone(a.status, a.priority),
    statusLabel: waiting ?? APPOINTMENT_STATUS_LABEL[a.status],
    noMobile: !a.patientMobile,
    priority: a.priority,
    hasAlert: a.alertFlags?.hasAlert ?? false,
    hasRestrictedAlert: a.alertFlags?.hasRestricted ?? false,
    hasDue: a.hasDue ?? false,
    duePaise: a.duePaise ?? null,
    rxToPrintId: a.rxToPrint?.prescriptionId ?? null,
    payLink: payLink(a),
    status: a.status,
    primary: primaryRowAction({
      status: a.status,
      payLink: payLink(a),
      allowed: statusActionButtons(a.status, {
        startAt: new Date(a.startAt),
        statusChangedAt: new Date(a.updatedAt),
        now,
      }).map((b) => b.status),
    }),
    version: a.version,
    startAt: a.startAt,
    updatedAt: a.updatedAt,
    highlighted,
  };
}

/** Pure Today model from day API rows (2.4.3). */
export function buildTodayModel(
  appointments: DayAppointment[],
  window: DayWindow,
  serverNow: string,
): TodayModel {
  const now = new Date(serverNow);
  const active = appointments.filter((a) => a.status !== "cancelled" && a.status !== "rescheduled");
  const busyForSlots = active.filter((a) => a.status !== "no_show");
  // Q1.8: only times from now until closing count; a slot that already passed cannot be booked.
  const nowMin = istMinutes(now);
  const openSlots = window.closed
    ? 0
    : emptySlotStarts(window, busyForSlots).filter((start) => start >= nowMin).length;
  const arrived = active.filter((a) => a.status === "arrived");
  const waitingSorted = sortWaitingQueue(
    arrived.map((a) => ({
      id: a.id,
      priority: a.priority,
      arrivedAt: a.arrivedAt,
      createdAt: a.startAt,
    })),
  );
  const nextId = waitingSorted[0]?.id ?? null;
  const nextAppt = nextId ? arrived.find((a) => a.id === nextId) : null;

  let longestWaitMin: number | null = null;
  for (const a of arrived) {
    if (!a.arrivedAt) continue;
    const m = Math.floor((now.getTime() - new Date(a.arrivedAt).getTime()) / 60_000);
    if (longestWaitMin === null || m > longestWaitMin) longestWaitMin = Math.max(0, m);
  }

  const rows = active
    .slice()
    .sort((a, b) => a.startMin - b.startMin || a.startAt.localeCompare(b.startAt))
    .map((a) => toRow(a, now, a.id === nextId));

  const inChair = active.filter((a) => a.status === "in_chair");
  const readyRows = rows.filter((r) => r.payLink !== null);

  const callList = appointments
    .filter((a) => a.status === "no_show")
    .map((a) => ({
      id: a.id,
      patientId: a.patientId,
      visitTypeId: a.visitTypeId,
      initials: initials(a.patientName),
      name: a.patientName,
      note: "Missed today — needs a new slot",
      mobile: a.patientMobile ? displayMobile(a.patientMobile) : null,
    }));

  return {
    appointmentsCount: active.filter((a) => a.status !== "no_show").length,
    openSlots,
    waitingCount: arrived.length,
    inChairCount: inChair.length,
    inChairName: inChair[0]?.patientName ?? null,
    readyToBillPaise: readyRows.every((r) => r.duePaise != null)
      ? readyRows.reduce((sum, r) => sum + (r.duePaise ?? 0), 0)
      : null,
    readyToBillCount: readyRows.length,
    longestWaitMin,
    next: nextAppt
      ? {
          id: nextAppt.id,
          name: nextAppt.patientName,
          patientNo: nextAppt.patientCode,
          visit: `${nextAppt.visitTypeLabel}, ${nextAppt.endMin - nextAppt.startMin} min`,
          mobile: nextAppt.patientMobile ? displayMobile(nextAppt.patientMobile) : "No mobile",
          waiting: formatWaiting(nextAppt.arrivedAt, now),
          version: nextAppt.version,
          status: nextAppt.status,
          startAt: nextAppt.startAt,
          updatedAt: nextAppt.updatedAt,
          hasAlert: nextAppt.alertFlags?.hasAlert ?? false,
          hasRestrictedAlert: nextAppt.alertFlags?.hasRestricted ?? false,
        }
      : null,
    rows,
    callList,
  };
}
