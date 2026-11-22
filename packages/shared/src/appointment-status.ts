import type { AppointmentStatus } from "./appointments";

/** Minutes after start_at before no_show is allowed (PLAN 2.3.6; later a setting in 6.5.3). */
export const NO_SHOW_AFTER_MINUTES = 15;

/** How long cancelled/no_show may be corrected back to scheduled (PLAN 2.3.6). */
export const STATUS_UNDO_HOURS = 24;

// One place for the status wheel. Anything else is refused (409/invalid).
const NEXT: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  scheduled: ["confirmed", "arrived", "cancelled", "no_show", "rescheduled"],
  confirmed: ["arrived", "cancelled", "no_show", "rescheduled"],
  arrived: ["in_chair", "cancelled"],
  in_chair: ["completed"],
  completed: [],
  cancelled: ["scheduled"],
  no_show: ["scheduled"],
  rescheduled: [],
};

export function allowedNextStatuses(from: AppointmentStatus): readonly AppointmentStatus[] {
  return NEXT[from];
}

export function isAllowedStatusTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return NEXT[from].includes(to);
}

/** Labels for status action buttons (English only). */
export const APPOINTMENT_STATUS_ACTION_LABEL: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirm",
  arrived: "Arrived",
  in_chair: "In chair",
  completed: "Completed",
  cancelled: "Cancel",
  no_show: "No-show",
  rescheduled: "Reschedule",
};

export type StatusTransitionContext = {
  startAt: Date;
  /** When status last became cancelled or no_show (for undo window). */
  statusChangedAt: Date;
  now: Date;
};

/**
 * Next statuses the UI may offer as buttons, after time gates (no_show delay, undo window).
 */
export function statusActionTargets(
  from: AppointmentStatus,
  ctx: StatusTransitionContext,
): AppointmentStatus[] {
  return allowedNextStatuses(from).filter(
    (to) => statusTransitionBlockReason(from, to, ctx) === null,
  );
}

/** Plain sentence if blocked; null if the transition is allowed now. */
export function statusTransitionBlockReason(
  from: AppointmentStatus,
  to: AppointmentStatus,
  ctx: StatusTransitionContext,
): string | null {
  if (!isAllowedStatusTransition(from, to)) {
    return "That status change is not allowed.";
  }
  if (to === "no_show") {
    const earliest = ctx.startAt.getTime() + NO_SHOW_AFTER_MINUTES * 60 * 1000;
    if (ctx.now.getTime() < earliest) {
      return `No-show can be marked only ${NO_SHOW_AFTER_MINUTES} minutes after the appointment start.`;
    }
  }
  if ((from === "cancelled" || from === "no_show") && to === "scheduled") {
    const deadline = ctx.statusChangedAt.getTime() + STATUS_UNDO_HOURS * 60 * 60 * 1000;
    if (ctx.now.getTime() > deadline) {
      return `A cancelled or no-show visit can only be put back on the schedule within ${STATUS_UNDO_HOURS} hours.`;
    }
  }
  return null;
}
