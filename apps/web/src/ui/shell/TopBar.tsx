import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router";
import { icons } from "../icons";
import { NEW_PATIENT_PATH } from "./nav-items";
import { isSearchShortcut } from "./search-shortcut";

// Tablet and laptop: search ("/" jumps here), Walk-in and the main "+ New patient" button (not
// wired yet), and on tablet the user card (on laptop it sits in the sidebar).
export function TopBar({ canAddPatient, user }: { canAddPatient: boolean; user: ReactNode }) {
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const input = search.current;
      const { key, ctrlKey, metaKey, altKey } = event;
      const target = event.target instanceof HTMLElement ? event.target : null;
      // The top bar is hidden on phones; then the shortcut does nothing.
      if (!input || input.offsetParent === null) return;
      if (!isSearchShortcut({ key, ctrlKey, metaKey, altKey, target })) return;
      event.preventDefault();
      input.focus();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="shell-top">
      <label className="top-search">
        <span className="top-search-icon">{icons.search}</span>
        <span className="sr-only">Search patients (shortcut: /)</span>
        <input
          ref={search}
          className="input"
          type="search"
          placeholder="Search by name, mobile or patient number"
        />
        <kbd className="top-search-key" aria-hidden="true">
          /
        </kbd>
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
