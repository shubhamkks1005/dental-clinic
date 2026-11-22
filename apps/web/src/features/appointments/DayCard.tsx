import { APPOINTMENT_STATUS_LABEL, appointmentStatusTone, toHhmm } from "@clinic/shared";
import type { CSSProperties, DragEvent } from "react";
import { StatusBadge } from "../../ui/StatusBadge";
import { AlertsStrip } from "../medical-history";
import type { DayAppointment } from "./api";

export const PX_PER_MIN = 1.4;

export function cardStyle(row: DayAppointment, dayStartMin: number): CSSProperties {
  return {
    top: (row.startMin - dayStartMin) * PX_PER_MIN,
    height: Math.max((row.endMin - row.startMin) * PX_PER_MIN, 28),
  };
}

type Props = {
  row: DayAppointment;
  dayStartMin: number;
  selected: boolean;
  onSelect: () => void;
  onDragStart: (e: DragEvent) => void;
};

export function DayCard({ row, dayStartMin, selected, onSelect, onDragStart }: Props) {
  const tone = appointmentStatusTone(row.status, row.priority);
  const muted =
    row.status === "cancelled" || row.status === "no_show" || row.status === "rescheduled";
  return (
    <button
      type="button"
      className={`day-card day-card-${tone}${muted ? " day-card-muted" : ""}${selected ? " day-card-selected" : ""}`}
      style={cardStyle(row, dayStartMin)}
      draggable={!muted && row.status !== "completed"}
      onDragStart={onDragStart}
      onClick={onSelect}
      aria-label={`${toHhmm(row.startMin)} ${row.patientName}, ${APPOINTMENT_STATUS_LABEL[row.status]}`}
    >
      <span className="day-card-time">
        {toHhmm(row.startMin)}–{toHhmm(row.endMin)}
      </span>
      <span className="day-card-name">
        {row.patientName}
        {row.alertFlags?.hasAlert ? <AlertsStrip mode="icon" flags={row.alertFlags} /> : null}
      </span>
      <span className="day-card-visit small muted">{row.visitTypeLabel}</span>
      <StatusBadge tone={tone} label={APPOINTMENT_STATUS_LABEL[row.status]} />
    </button>
  );
}
