import { APPOINTMENT_STATUS_LABEL, displayMobile, toHhmm } from "@clinic/shared";
import { Link } from "react-router";
import { PatientNoChip } from "../../ui/PatientNoChip";
import type { DayAppointment } from "./api";

type Props = {
  row: DayAppointment | null;
  onClose: () => void;
};

export function DayDetails({ row, onClose }: Props) {
  if (!row) return null;
  const mobile = row.patientMobile ? displayMobile(row.patientMobile) : "No mobile";
  return (
    <aside className="day-details" aria-label="Appointment details">
      <div className="day-details-head">
        <h2>{row.patientName}</h2>
        <button type="button" className="btn btn-compact" onClick={onClose}>
          Close
        </button>
      </div>
      <PatientNoChip patientNo={row.patientCode} />
      <dl className="day-details-dl">
        <div>
          <dt>Time</dt>
          <dd>
            {toHhmm(row.startMin)}–{toHhmm(row.endMin)}
          </dd>
        </div>
        <div>
          <dt>Visit</dt>
          <dd>{row.visitTypeLabel}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{APPOINTMENT_STATUS_LABEL[row.status]}</dd>
        </div>
        <div>
          <dt>Mobile</dt>
          <dd>{mobile}</dd>
        </div>
        {row.complaint ? (
          <div>
            <dt>Note</dt>
            <dd>{row.complaint}</dd>
          </div>
        ) : null}
      </dl>
      <Link className="btn" to={`/app/patients/${encodeURIComponent(row.patientId)}`}>
        Open profile
      </Link>
    </aside>
  );
}
