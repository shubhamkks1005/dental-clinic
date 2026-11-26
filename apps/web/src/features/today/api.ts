import type { AppointmentStatus } from "@clinic/shared";
import { api } from "../../api/client";
import { listDayAppointments, type DayAppointmentsReply } from "../appointments";

export { listDayAppointments, type DayAppointmentsReply };

export function changeAppointmentStatus(
  id: string,
  body: { status: AppointmentStatus; version: number },
): Promise<void> {
  return api(`/api/staff/appointments/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body,
  }).then(() => undefined);
}

export function walkInAppointment(body: {
  patientId: string;
  visitTypeId: string;
  priority?: "normal" | "emergency";
  complaint?: string | null;
  /** Desk with several doctors: whose queue. */
  doctorId?: string;
}): Promise<void> {
  return api("/api/staff/appointments/walk-in", { method: "POST", body }).then(() => undefined);
}
