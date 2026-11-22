import type { ReactNode } from "react";
import { Link } from "react-router";
import { NEW_PATIENT_PATH } from "./nav-items";

// Tablet and laptop: search slot (feature owns the combobox), Walk-in and + New patient.
export function TopBar({
  canAddPatient,
  user,
  search,
}: {
  canAddPatient: boolean;
  user: ReactNode;
  search: ReactNode;
}) {
  return (
    <header className="shell-top">
      {search}
      {canAddPatient && (
        <>
          <button type="button" className="btn">
            Walk-in
          </button>
          <Link to={NEW_PATIENT_PATH} className="btn btn-primary">
            + New patient
          </Link>
        </>
      )}
      <div className="top-user">{user}</div>
    </header>
  );
}
