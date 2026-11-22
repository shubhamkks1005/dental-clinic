import {
  APPOINTMENT_STATUS_ACTION_LABEL,
  statusActionTargets,
  type AppointmentStatus,
} from "@clinic/shared";

export type StatusActionButton = {
  status: AppointmentStatus;
  label: string;
};

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
