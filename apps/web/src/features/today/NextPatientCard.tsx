import { PatientNoChip } from "../../ui/PatientNoChip";
import type { sampleNextPatient } from "./sample-data";

type NextPatient = typeof sampleNextPatient;

export function NextPatientCard({ patient }: { patient: NextPatient }) {
  return (
    <section className="next-patient" aria-label="Next patient">
      <p className="next-label small">Next patient</p>
      <p className="next-name">{patient.name}</p>
      <p className="next-meta">
        <PatientNoChip patientNo={patient.patientNo} />
        <span>
          {patient.visit} · {patient.mobile}
        </span>
      </p>
      <button type="button" className="btn next-send">
        Send in
      </button>
    </section>
  );
}
