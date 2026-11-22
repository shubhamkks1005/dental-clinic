import { Link, useParams } from "react-router";
import { ConsentsPanel } from "./ConsentsPanel";

// Temporary home for 2.1.9 until the full patient profile (2.2.2) lands.
export function PatientConsentsScreen() {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return (
      <p className="notice notice-error" role="alert">
        Patient not found. Go back to the patients list.
      </p>
    );
  }
  return (
    <div className="patients">
      <p>
        <Link to="/app/patients">← Patients</Link>
      </p>
      <ConsentsPanel patientId={id} />
    </div>
  );
}
