import { formatClockTime, formatDuration, type DayWindow, type Doctor } from "@clinic/shared";
import { DoctorBadge } from "../../ui/DoctorBadge";
import { useState } from "react";
import { StatusLabel } from "../../ui/StatusLabel";
import { kindOf } from "./appointment-kinds";
import type { DayAppointment } from "./api";
import { DayDetails } from "./DayDetails";

type Props = {
  window: DayWindow;
  appointments: DayAppointment[];
  /** Desk: each row shows its doctor (a doctor sees only their own). */
  doctorsById?: Map<string, Doctor> | null;
  onChanged: () => void;
};

const GONE = ["cancelled", "no_show", "rescheduled"];

// PhoneCalendar.dc.html: the day as a list with full names, no grid.
export function PhoneDayList({ window, appointments, doctorsById = null, onChanged }: Props) {
  const doctorOf = (a: DayAppointment) =>
    a.doctorId && doctorsById ? (doctorsById.get(a.doctorId) ?? null) : null;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = appointments.find((a) => a.id === selectedId) ?? null;
  // A closed day can still hold late entries (PA-M06): the list shows them under the notice.
  if (window.closed && appointments.length === 0)
    return <p className="muted">Clinic is closed on this day.</p>;
  return (
    <div className="phone-day">
      {window.closed ? (
        <p className="muted">Clinic is closed on this day. These are late entries.</p>
      ) : null}
      {appointments.length === 0 ? (
        <p className="muted">No appointments on this day.</p>
      ) : (
        <ul className="phone-day-list">
          {appointments.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className={`phone-day-row kind-${kindOf(a.visitTypeLabel)}${GONE.includes(a.status) ? " day-card-muted" : ""}`}
                onClick={() => setSelectedId(a.id)}
              >
                <span className="phone-day-time">
                  <strong>{formatClockTime(a.startMin)}</strong>
                  <span className="small muted">{formatDuration(a.endMin - a.startMin)}</span>
                </span>
                <span className="phone-day-bar" aria-hidden="true" />
                <span className="phone-day-who">
                  <strong>{a.patientName}</strong>
                  <span className="small muted">{a.visitTypeLabel}</span>
                  <DoctorBadge doctor={doctorOf(a)} />
                </span>
                <StatusLabel kind="appointment" value={a.status} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={selected ? "day-details-sheet" : undefined}>
        <DayDetails
          row={selected}
          doctor={selected ? doctorOf(selected) : null}
          onClose={() => setSelectedId(null)}
          onChanged={onChanged}
        />
      </div>
    </div>
  );
}
