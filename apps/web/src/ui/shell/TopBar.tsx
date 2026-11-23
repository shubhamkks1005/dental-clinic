import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
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
  // Q1.9: one Walk-in. Today has its own button; on every other page this one opens Today with
  // the walk-in dialog ready.
  const onToday = useLocation().pathname.replace(/\/$/, "") === "/app";
  return (
    <header className="shell-top">
      {search}
      {canAddPatient && (
        <>
          {onToday ? null : (
            <Link to="/app?walkin=1" className="btn">
              Walk-in
            </Link>
          )}
          <Link to={NEW_PATIENT_PATH} className="btn btn-primary">
            + New patient
          </Link>
        </>
      )}
      <div className="top-user">{user}</div>
    </header>
  );
}
