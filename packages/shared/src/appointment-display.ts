import type { AppointmentStatus } from "./appointments";

/** English status words for day/Today cards (never colour alone). */
export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  arrived: "Arrived",
  in_chair: "In chair",
  completed: "Done",
  cancelled: "Cancelled",
  no_show: "No-show",
  rescheduled: "Rescheduled",
};

/** Badge tones used by the staff UI (matches DESIGN.md status colours). */
export type AppointmentStatusTone = "done" | "in-room" | "waiting" | "emergency" | "upcoming";

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
  switch (status) {
    case "completed":
      return "done";
    case "in_chair":
      return "in-room";
    case "arrived":
      return "waiting";
    case "cancelled":
    case "no_show":
    case "rescheduled":
      return "upcoming";
    default:
      return "upcoming";
  }
}
