import {
  displayMobile,
  formatClockTime,
  formatDuration,
  formatRupees,
  istDate,
  type Doctor,
} from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { DoctorBadge } from "../../ui/DoctorBadge";
import { formatDate } from "../../ui/format";
import { useMe } from "../auth";
import { getAppointmentChain } from "../patients/api";
import { AppointmentActions } from "./AppointmentActions";
import { getLastVisit, type DayAppointment } from "./api";
import { CalIcon } from "./CalIcon";
import { cardWords } from "./CalCard";
import "./cal-tokens.css";
import "./cal-details.css";

type Props = {
  row: DayAppointment | null;
  /** Desk: the booking's doctor (a doctor sees only their own). */
  doctor?: Doctor | null;
  onClose: () => void;
  onChanged: () => void;
};

// Booking details panel (not in the HTML; owner 2026-11-26: "click a patient -> details on the
// right, in the new theme", P5.9). Header like the popover's; actions unchanged.
export function DayDetails({ row, doctor = null, onClose, onChanged }: Props) {
  const me = useMe();
  const isDoctor = me.role === "doctor";
  const [movedFrom, setMovedFrom] = useState<string | null>(null);
  const [last, setLast] = useState<string | null | undefined>(undefined);
  const id = row?.id;
  const patientId = row?.patientId;

  useEffect(() => {
    setMovedFrom(null);
    if (!id) return;
    let current = true;
    getAppointmentChain(id)
      .then((chain) => {
        const i = chain.findIndex((c) => c.id === id);
        const prev = i > 0 ? chain[i - 1] : null;
        if (current && prev)
          setMovedFrom(`${formatDate(prev.dateLocal)}, ${formatClockTime(prev.startMin)}`);
      })
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, [id]);

  useEffect(() => {
    setLast(undefined);
    if (!patientId || !isDoctor) return;
    let current = true;
    getLastVisit(patientId)
      .then((v) => {
        if (!current) return;
        setLast(
          v
            ? `Last visit ${formatDate(v.dateLocal)}: ${v.procedures.join(", ") || "Visit"}`
            : "First visit",
        );
      })
      .catch(() => current && setLast(null));
    return () => {
      current = false;
    };
  }, [patientId, isDoctor]);

  if (!row) return null;
  const mobile = row.patientMobile ? displayMobile(row.patientMobile) : "No mobile";
  const isToday = row.dateLocal === istDate(new Date());
  const lines: [string, React.ReactNode][] = [
    [
      "Time",
      `${formatDate(row.dateLocal)}, ${formatClockTime(row.startMin)} – ${formatClockTime(row.endMin)} (${formatDuration(row.endMin - row.startMin)})`,
    ],
    ["Visit", row.visitTypeLabel],
    ["Status", cardWords(row).join(" · ")],
  ];
  if (!isDoctor && doctor)
    lines.push(["Doctor", <DoctorBadge key="d" doctor={doctor} full className="is-large" />]);
  if (row.alertFlags?.hasAlert || row.alertFlags?.hasRestricted)
    lines.push([
      "Marks",
      <span key="m" className="cal-details-marks">
        {row.alertFlags.hasAlert ? <CalIcon name="medical_alert" label="Medical alert" /> : null}
        {row.alertFlags.hasAlert ? "Medical alert" : null}
        {row.alertFlags.hasRestricted ? " · Restricted history" : null}
      </span>,
    ]);
  if (row.complaint) lines.push(["Note", row.complaint]);
  lines.push(["Mobile", mobile]);
  if (movedFrom) lines.push(["Moved from", movedFrom]);
  if (row.hasDue)
    lines.push(["Due", !isDoctor && row.duePaise ? formatRupees(row.duePaise) : "Due"]);

  return (
    <aside className="cal-scope cal-details" aria-label="Appointment details">
      <div className="cal-details-head">
        <div className="cal-details-title">
          <span className="bk-tile">
            <CalIcon name="event_available" />
          </span>
          <div className="cal-details-who">
            <h2>{row.patientName}</h2>
            <span className="cal-code-chip">{row.patientCode}</span>
          </div>
        </div>
        <button type="button" className="bk-x" aria-label="Close details" onClick={onClose}>
          <CalIcon name="close" />
        </button>
      </div>
      <dl className="cal-details-dl">
        {lines.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      {isDoctor ? (
        <p className="cal-details-last" data-testid="last-visit">
          {last === undefined ? (
            <span className="cal-skel" aria-label="Loading last visit" />
          ) : (
            last
          )}
        </p>
      ) : null}
      <div className="cal-details-actions">
        <AppointmentActions
          layout="panel"
          row={row}
          onChanged={() => {
            onChanged();
            onClose();
          }}
        >
          <Link className="bk-btn" to={`/app/patients/${encodeURIComponent(row.patientId)}`}>
            Open profile
          </Link>
          {isToday ? (
            <Link className="bk-btn" to="/app">
              Go to Today
            </Link>
          ) : null}
        </AppointmentActions>
      </div>
    </aside>
  );
}
