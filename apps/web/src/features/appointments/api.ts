import type {
  AppointmentPriority,
  CurrentBreak,
  LastOrderChange,
  AppointmentStatus,
  CancelReasonCode,
  DayWindow,
  DayLeave,
  Doctor,
  AppointmentSearchHit,
} from "@clinic/shared";
import { api } from "../../api/client";

export type DayAppointment = {
  id: string;
  patientId: string;
  patientCode: string;
  patientName: string;
  patientMobile: string | null;
  visitTypeId: string;
  visitTypeLabel: string;
  startAt: string;
  dateLocal: string;
  startMin: number;
  endMin: number;
  status: AppointmentStatus;
  priority: AppointmentPriority;
  overbook: boolean;
  complaint: string | null;
  arrivedAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  updatedAt: string;
  version: number;
  /** Several doctors (2026-11-26); null on old rows. */
  doctorId?: string | null;
  /** 3.3.2 icon-only; never clinical labels. */
  alertFlags?: { hasAlert: boolean; hasRestricted: boolean };
  /** 5.3.4: unpaid balance mark; duePaise only for receptionist. */
  hasDue?: boolean;
  duePaise?: number | null;
  /** Q1.2 (receptionist only): visit is finalised and not fully paid; billId null = no bill yet. */
  readyToBill?: { billId: string | null } | null;
  /** Visit finished (receptionist only): a prescription the doctor passed to the desk to print. */
  rxToPrint?: { prescriptionId: string; rxNo: string | null } | null;
  /** Part T: the doctor's saved order and its flags (empty on an older server reply). */
  queueOrder?: number | null;
  steppedOutAt?: string | null;
  skipCount?: number;
  lateAt?: string | null;
  queueChangedAt?: string | null;
};

export type DayAppointmentsReply = {
  dateLocal: string;
  serverNow: string;
  window: DayWindow;
  appointments: DayAppointment[];
  lastOrderChange?: LastOrderChange | null;
  currentBreak?: CurrentBreak | null;
  openBreaks?: CurrentBreak[];
  /** Doctors on leave that day (a doctor sees only their own). */
  leaves?: DayLeave[];
};

export function listDayAppointments(dateLocal: string): Promise<DayAppointmentsReply> {
  return api<DayAppointmentsReply>(`/api/staff/appointments?date=${encodeURIComponent(dateLocal)}`);
}

/** S3.2.2: up to 7 days in one request; each day has the day-view shape. */
export function listAppointmentRange(from: string, to: string): Promise<DayAppointmentsReply[]> {
  const q = new URLSearchParams({ from, to });
  return api<{ days: DayAppointmentsReply[] }>(`/api/staff/appointments/range?${q}`).then(
    (r) => r.days,
  );
}

export function rescheduleAppointment(
  id: string,
  body: {
    version: number;
    dateLocal: string;
    startMin: number;
    doctorId?: string;
    durationMin?: number;
    overrideReason?: string;
  },
): Promise<{ appointment: DayAppointment }> {
  return api(`/api/staff/appointments/${encodeURIComponent(id)}/reschedule`, {
    method: "POST",
    body,
  });
}

export type SuggestedSlot = {
  dateLocal: string;
  startMin: number;
  endMin: number;
  startAt: string;
};

export function suggestSlots(
  visitTypeId: string,
  dateLocal?: string,
  opts: { dayOnly?: boolean } = {},
): Promise<SuggestedSlot[]> {
  const q = new URLSearchParams({ visitTypeId });
  if (dateLocal) q.set("date", dateLocal);
  if (opts.dayOnly) q.set("day", "1");
  return api<{ slots: SuggestedSlot[] }>(`/api/staff/appointments/slots?${q}`).then((r) => r.slots);
}

/** Active doctors (several doctors, 2026-11-26). */
export function listDoctors() {
  return api<{ doctors: Doctor[] }>("/api/staff/doctors").then((r) => r.doctors);
}

/** Calendar search (Q7): coming bookings of the chosen doctors (a doctor: own only). */
export function searchAppointments(q: string, doctorIds: string[]) {
  const p = new URLSearchParams({ q });
  if (doctorIds.length) p.set("doctors", doctorIds.join(","));
  return api<{ hits: AppointmentSearchHit[] }>(`/api/staff/appointments/search?${p}`).then(
    (r) => r.hits,
  );
}

/** Doctor only: the patient's latest finished visit, or null for a first visit. */
export function getLastVisit(patientId: string) {
  return api<{ lastVisit: { dateLocal: string; procedures: string[] } | null }>(
    `/api/staff/patients/${encodeURIComponent(patientId)}/last-visit`,
  ).then((r) => r.lastVisit);
}

export function bookAppointment(body: {
  patientId: string;
  visitTypeId: string;
  doctorId: string;
  durationMin?: number;
  dateLocal: string;
  startMin: number;
  source: "phone";
  complaint?: string | null;
  overrideReason?: string | null;
}): Promise<{ appointment: DayAppointment }> {
  return api("/api/staff/appointments", { method: "POST", body });
}

/** Replies with the new version, so a just-made cancel can be undone. */
export function cancelAppointment(
  id: string,
  body: { version: number; reason: CancelReasonCode; detail?: string },
): Promise<number> {
  return api<{ appointment: { version: number } }>(
    `/api/staff/appointments/${encodeURIComponent(id)}/cancel`,
    { method: "POST", body },
  ).then((r) => r.appointment.version);
}

export function undoCancelAppointment(id: string, version: number): Promise<void> {
  return api(`/api/staff/appointments/${encodeURIComponent(id)}/undo-cancel`, {
    method: "POST",
    body: { version },
  }).then(() => undefined);
}

export function markMissed(id: string, version: number, reason: string): Promise<void> {
  return api(`/api/staff/appointments/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: { status: "no_show", version, cancelReason: reason },
  }).then(() => undefined);
}
