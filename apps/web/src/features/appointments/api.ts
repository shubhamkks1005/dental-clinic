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
