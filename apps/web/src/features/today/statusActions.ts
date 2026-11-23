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

export type RowPrimary =
  { status: AppointmentStatus; label: string } | { pay: string; label: string };

/**
 * Q2.5: ONE main button per Today row, chosen by where the patient is.
 * Booked -> Arrived, Waiting -> Send in, In chair -> Done, finished and not paid -> Take payment.
 * Everything else (Reschedule, Cancel, Missed) lives in the "..." menu.
 */
export function primaryRowAction(row: {
  status: AppointmentStatus;
  payLink: string | null;
  allowed: AppointmentStatus[];
}): RowPrimary | null {
  if (row.payLink) return { pay: row.payLink, label: "Take payment" };
  const pick = (status: AppointmentStatus, label: string) =>
    row.allowed.includes(status) ? { status, label } : null;
  if (row.status === "scheduled" || row.status === "confirmed") return pick("arrived", "Arrived");
  if (row.status === "arrived") return pick("in_chair", "Send in");
  if (row.status === "in_chair") return pick("completed", "Done");
  return null;
}
