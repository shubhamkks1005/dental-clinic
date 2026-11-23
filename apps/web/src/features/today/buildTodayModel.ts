import {
  APPOINTMENT_STATUS_LABEL,
  appointmentStatusTone,
  displayMobile,
  emptySlotStarts,
  formatWaiting,
  sortWaitingQueue,
  toHhmm,
  type DayWindow,
} from "@clinic/shared";
import type { StatusTone } from "../../ui/StatusBadge";
import type { DayAppointment } from "../appointments";
import { statusActionButtons } from "./statusActions";

export type TodayListRow = {
  id: string;
  patientId: string;
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
  actions: { status: DayAppointment["status"]; label: string }[];
  version: number;
  startAt: string;
  updatedAt: string;
  highlighted: boolean;
};

export type TodayModel = {
  appointmentsCount: number;
  openSlots: number;
  arrivedCount: number;
  waitingCount: number;
  longestWaitMin: number | null;
  next: {
    id: string;
    name: string;
    patientNo: string;
    visit: string;
    mobile: string;
    version: number;
    status: DayAppointment["status"];
    startAt: string;
    updatedAt: string;
    hasAlert: boolean;
    hasRestrictedAlert: boolean;
  } | null;
  rows: TodayListRow[];
  callList: { id: string; initials: string; name: string; note: string; mobile: string | null }[];
  doctorNow: TodayListRow | null;
  doctorNext: TodayListRow[];
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (a + b).toUpperCase();
}

function toRow(a: DayAppointment, now: Date, highlighted: boolean): TodayListRow {
  const waiting = a.status === "arrived" ? formatWaiting(a.arrivedAt, now) : null;
  return {
    id: a.id,
    patientId: a.patientId,
    time: toHhmm(a.startMin),
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
    actions: statusActionButtons(a.status, {
      startAt: new Date(a.startAt),
      statusChangedAt: new Date(a.updatedAt),
      now,
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
  const openSlots = window.closed ? 0 : emptySlotStarts(window, busyForSlots).length;
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

  const callList = appointments
    .filter((a) => a.status === "no_show")
    .map((a) => ({
      id: a.id,
      initials: initials(a.patientName),
      name: a.patientName,
      note: "Missed today — needs a new slot",
      mobile: a.patientMobile ? displayMobile(a.patientMobile) : null,
    }));

  const inChair = rows.find((r) => r.statusLabel === "In chair") ?? null;
  const doctorNow = inChair ?? (nextId ? (rows.find((r) => r.id === nextId) ?? null) : null);
  const doctorNext = rows
    .filter(
      (r) =>
        r.id !== doctorNow?.id &&
        (r.statusLabel === "Scheduled" ||
          r.statusLabel === "Confirmed" ||
          r.statusLabel.startsWith("Waiting") ||
          r.statusLabel === "Arrived"),
    )
    .slice(0, 3);

  return {
    appointmentsCount: active.filter((a) => a.status !== "no_show").length,
    openSlots,
    arrivedCount: arrived.length + active.filter((a) => a.status === "in_chair").length,
    waitingCount: arrived.length,
    longestWaitMin,
    next: nextAppt
      ? {
          id: nextAppt.id,
          name: nextAppt.patientName,
          patientNo: nextAppt.patientCode,
          visit: `${nextAppt.visitTypeLabel}, ${nextAppt.endMin - nextAppt.startMin} min`,
          mobile: nextAppt.patientMobile ? displayMobile(nextAppt.patientMobile) : "No mobile",
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
    doctorNow,
    doctorNext,
  };
}
