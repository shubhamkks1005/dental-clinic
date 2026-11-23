import type { AppointmentPriority, AppointmentStatus, DayWindow } from "@clinic/shared";
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
  /** 3.3.2 icon-only; never clinical labels. */
  alertFlags?: { hasAlert: boolean; hasRestricted: boolean };
  /** 5.3.4: unpaid balance mark; duePaise only for receptionist. */
  hasDue?: boolean;
  duePaise?: number | null;
};

export type DayAppointmentsReply = {
  dateLocal: string;
  serverNow: string;
  window: DayWindow;
  appointments: DayAppointment[];
};

export function listDayAppointments(dateLocal: string): Promise<DayAppointmentsReply> {
  return api<DayAppointmentsReply>(`/api/staff/appointments?date=${encodeURIComponent(dateLocal)}`);
}

export function rescheduleAppointment(
  id: string,
  body: { version: number; dateLocal: string; startMin: number; overrideReason?: string },
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

export function bookAppointment(body: {
  patientId: string;
  visitTypeId: string;
  dateLocal: string;
  startMin: number;
  source: "phone";
  complaint?: string | null;
  overrideReason?: string | null;
}): Promise<{ appointment: DayAppointment }> {
  return api("/api/staff/appointments", { method: "POST", body });
}
