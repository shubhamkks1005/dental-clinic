import {
  APPOINTMENT_STATUS_ACTION_LABEL,
  statusActionTargets,
  type AppointmentStatus,
} from "@clinic/shared";

export type StatusActionButton = {
  status: AppointmentStatus;
  label: string;
};

/** Opening a visit from Today puts the patient in the chair (owner decision 2026-11-23). */
export function movesToChairOnOpen(status: AppointmentStatus): boolean {
  return status === "scheduled" || status === "confirmed" || status === "arrived";
}

/** Buttons the Today/day UI may show for one appointment (2.3.6). */
export function statusActionButtons(
  from: AppointmentStatus,
  ctx: { startAt: Date; statusChangedAt: Date; now: Date },
): StatusActionButton[] {
  return statusActionTargets(from, ctx).map((status) => ({
    status,
    label: APPOINTMENT_STATUS_ACTION_LABEL[status],
  }));
}
