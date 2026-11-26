import { APPOINTMENT_STATUS_LABEL, formatClockTime, formatDate, type Doctor } from "@clinic/shared";
import type { CSSProperties } from "react";
import { DoctorBadge } from "../../ui/DoctorBadge";
import type { DayAppointment } from "./api";
import { CalIcon } from "./CalIcon";

const GONE = ["cancelled", "rescheduled"];

export function cardTone(row: Pick<DayAppointment, "status" | "priority">): string {
  if (GONE.includes(row.status)) return "gone";
  if (row.status === "no_show") return "missed";
  if (row.priority === "emergency") return "emergency";
  if (row.status === "arrived" || row.status === "in_chair") return "chair";
  if (row.status === "completed") return "done";
  if (row.status === "confirmed") return "confirmed";
  return "plain";
}

/** Words on the card: the app's status word (L8), plus Emergency / Overbooked (P5.5.3). */
export function cardWords(row: Pick<DayAppointment, "status" | "priority" | "overbook">) {
  const words = [APPOINTMENT_STATUS_LABEL[row.status]];
  if (row.priority === "emergency" && !GONE.includes(row.status)) words.push("Emergency");
  if (row.overbook) words.push("Overbooked");
  return words;
}

type Props = {
  row: DayAppointment;
  style: CSSProperties;
  height: number;
  /** Desk only: the doctor's badge (a doctor sees only their own bookings). */
  doctor: Doctor | null;
  /** Sharing the width with a clash (P5.5.5): the name keeps row 1, the badge goes below. */
  narrow: boolean;
  selected: boolean;
  docked: boolean;
  onOpen: (row: DayAppointment, el: HTMLElement) => void;
};

// P5.5: one booking in the grid. The whole card is a button that opens the details panel.
export function CalCard({ row, style, height, doctor, narrow, selected, docked, onOpen }: Props) {
  const tone = cardTone(row);
  const words = cardWords(row);
  const time = formatClockTime(row.startMin);
  const tiny = height < 34;
  const tall = height >= 56;
  const who = doctor ? ` · ${doctor.name}` : "";
  const badgeTop = Boolean(doctor) && !narrow;
  const marks = (
    <span className="cal-card-marks">
      {row.alertFlags?.hasAlert ? <CalIcon name="medical_alert" label="Medical alert" /> : null}
      {row.alertFlags?.hasRestricted ? <CalIcon name="lock" label="Restricted history" /> : null}
      {row.hasDue ? <span className="cal-card-due">Due</span> : null}
    </span>
  );
  const name =
    tone === "emergency" ? (
      <span className="cal-card-name">
        <CalIcon name="emergency" />
        <span>{row.patientName}</span>
      </span>
    ) : (
      <span className="cal-card-name">{row.patientName}</span>
    );
  return (
    <button
      type="button"
      className={`cal-card tone-${tone}${tiny ? " is-tiny" : ""}${selected ? " is-selected" : ""}${docked ? " cal-card-docked" : ""}`}
      style={style}
      data-row-id={row.id}
      title={tiny || narrow ? `${time} ${row.patientName}, ${words.join(", ")}${who}` : undefined}
      aria-label={`${formatDate(row.dateLocal)} ${time} ${row.patientName}, ${words.join(", ")}${who}`}
      aria-pressed={selected}
      onClick={(e) => onOpen(row, e.currentTarget)}
    >
      {/* HTML 315: name with the doctor badge; then visit type with the status word. */}
      <span className="cal-card-row">
        {name}
        {tiny || narrow ? null : badgeTop ? (
          <DoctorBadge doctor={doctor} />
        ) : (
          <span className="cal-card-time">{time}</span>
        )}
      </span>
      {tiny ? null : (
        <span className="cal-card-row">
          <span className="cal-card-visit">{row.visitTypeLabel}</span>
          {tall ? null : marks}
          <span className="cal-card-status">{words.join(" · ")}</span>
        </span>
      )}
      {tall ? (
        <span className="cal-card-row">
          {tone === "chair" ? (
            <span className="cal-card-code">{row.patientCode}</span>
          ) : doctor && narrow ? (
            <DoctorBadge doctor={doctor} />
          ) : (
            <span className="cal-card-time">{time}</span>
          )}
          {marks}
        </span>
      ) : null}
    </button>
  );
}
