import type { ReactNode } from "react";
import { Link } from "react-router";
import { icons } from "../icons";
import { NEW_PATIENT_PATH } from "./nav-items";

// Tablet and laptop: search, Walk-in and the main "+ New patient" button (not wired yet), and on
// tablet the user card (on laptop it sits in the sidebar).
export function TopBar({ canAddPatient, user }: { canAddPatient: boolean; user: ReactNode }) {
  return (
    <header className="shell-top">
      <label className="top-search">
        <span className="top-search-icon">{icons.search}</span>
        <span className="sr-only">Search patients</span>
        <input
          className="input"
          type="search"
          placeholder="Search by name, mobile or patient number"
        />
      </label>
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
