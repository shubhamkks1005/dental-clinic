import { PatientNoChip } from "../../ui/PatientNoChip";
import { AlertsStrip } from "../medical-history";
import type { TodayModel } from "./buildTodayModel";

type Props = {
  patient: TodayModel["next"];
  busy: boolean;
  onSendIn: () => void;
};

export function NextPatientCard({ patient, busy, onSendIn }: Props) {
  if (!patient) {
    return (
      <section className="next-patient" aria-label="Next patient">
        <p className="next-label small">Next patient</p>
        <p className="muted">Nobody waiting yet.</p>
      </section>
    );
  }
  return (
    <section className="next-patient" aria-label="Next patient">
      <p className="next-label small">Next patient</p>
      <p className="next-name">
        {patient.name}
        {patient.hasAlert ? (
          <AlertsStrip
            mode="icon"
            flags={{
              hasAlert: patient.hasAlert,
              hasRestricted: patient.hasRestrictedAlert,
            }}
          />
        ) : null}
      </p>
      <p className="next-meta">
        <PatientNoChip patientNo={patient.patientNo} />
        <span>{patient.visit}</span>
      </p>
      <p className="next-meta">
        {patient.waiting ? `${patient.waiting} · ` : ""}
        {patient.mobile}
      </p>
      <button
        type="button"
        className="btn next-send"
        disabled={busy || patient.status !== "arrived"}
        onClick={onSendIn}
      >
        Send in
      </button>
    </section>
  );
}
