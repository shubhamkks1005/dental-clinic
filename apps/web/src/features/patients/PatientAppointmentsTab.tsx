import { Link } from "react-router";

// Appointments list arrives with 2.3; until then show an honest empty state (no dead buttons).
export function PatientAppointmentsTab({ patientId }: { patientId: string }) {
  return (
    <section className="patient-appts" aria-labelledby="appts-title">
      <h2 id="appts-title">Appointments</h2>
      <p className="muted">No appointments yet.</p>
      <Link
        className="btn btn-primary"
        to={`/app/appointments?patient=${encodeURIComponent(patientId)}`}
      >
        Book appointment
      </Link>
    </section>
  );
}
