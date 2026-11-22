// 2.3.1 appointment enums. Status transitions live in the worker domain (2.3.6).
// Times: start_at is UTC ISO; date_local + start_min/end_min are IST for overlap SQL.

export const APPOINTMENT_STATUSES = [
  "scheduled",
  "confirmed",
  "arrived",
  "in_chair",
  "completed",
  "cancelled",
  "no_show",
  "rescheduled",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENT_SOURCES = ["phone", "walk_in", "referral", "other"] as const;
export type AppointmentSource = (typeof APPOINTMENT_SOURCES)[number];

export const APPOINTMENT_PRIORITIES = ["normal", "emergency"] as const;
export type AppointmentPriority = (typeof APPOINTMENT_PRIORITIES)[number];

// One chair for now; UI hides chair_id (PLAN 2.3.1). Timings.chairs is the count.
export const DEFAULT_CHAIR_ID = "1";

// These statuses still hold the chair for overlap / free-slot math (2.3.3, 2.3.4).
export const APPOINTMENT_BUSY_STATUSES = [
  "scheduled",
  "confirmed",
  "arrived",
  "in_chair",
] as const satisfies readonly AppointmentStatus[];
export type AppointmentBusyStatus = (typeof APPOINTMENT_BUSY_STATUSES)[number];

export function appointmentHoldsChair(status: AppointmentStatus): boolean {
  return (APPOINTMENT_BUSY_STATUSES as readonly string[]).includes(status);
}
