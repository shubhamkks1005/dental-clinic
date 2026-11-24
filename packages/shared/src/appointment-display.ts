import type { AppointmentStatus } from "./appointments";
import { statusWord, type StatusTone } from "./status-words";

/** Words for appointment statuses: derived from the one status map (status-words.ts). */
export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: statusWord("appointment", "scheduled").label,
  confirmed: statusWord("appointment", "confirmed").label,
  arrived: statusWord("appointment", "arrived").label,
  in_chair: statusWord("appointment", "in_chair").label,
  completed: statusWord("appointment", "completed").label,
  cancelled: statusWord("appointment", "cancelled").label,
  no_show: statusWord("appointment", "no_show").label,
  rescheduled: statusWord("appointment", "rescheduled").label,
};

/** Words for the two list flags. They are not appointment statuses (the status wheel stays as is). */
export const APPOINTMENT_FLAG_LABEL = { steppedOut: "Stepped out", late: "Late" } as const;

/** Badge tones used by the staff UI (matches DESIGN.md status colours). */
export type AppointmentStatusTone = StatusTone;

export function appointmentStatusTone(
  status: AppointmentStatus,
  priority: "normal" | "emergency" = "normal",
): AppointmentStatusTone {
  if (
    priority === "emergency" &&
    (status === "scheduled" || status === "confirmed" || status === "arrived")
  ) {
    return "emergency";
  }
  return statusWord("appointment", status).tone;
}
