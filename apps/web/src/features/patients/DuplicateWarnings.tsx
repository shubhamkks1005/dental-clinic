import { displayMobile } from "@clinic/shared";
import { Link } from "react-router";
import type { DuplicateWarning } from "./api";

const REASON: Record<DuplicateWarning["reason"], string> = {
  first_name_mobile: "Same first name and mobile",
  mobile_only: "Same mobile",
};

/** Only a same-first-name match stops Save with "Same person?"; a family mobile never does (L35). */
export const asksSamePerson = (warnings: DuplicateWarning[]) =>
  warnings.some((w) => w.reason === "first_name_mobile");

// The list is soft; Save asks "Same person?" once (Q1.8) and the desk can still save as new.
export function DuplicateWarnings({
  warnings,
  ask = false,
  onSaveAsNew,
  onOpenExisting,
}: {
  warnings: DuplicateWarning[];
  /** Q1.8: Save was pressed with a possible match on screen: ask "Same person?". */
  ask?: boolean;
  onSaveAsNew?: () => void;
  onOpenExisting?: () => void;
}) {
  if (warnings.length === 0) return null;
  // The strongest match first: same first name and mobile, then the same mobile only.
  const rank = (w: DuplicateWarning) => (w.reason === "first_name_mobile" ? 0 : 1);
  const sorted = [...warnings].sort((a, b) => rank(a) - rank(b));
  const best = sorted[0]!;
  return (
    <div className="notice notice-warning new-patient-dupes" role="status">
      <p>Possible match — check before saving:</p>
      <ul>
        {sorted.map((w) => (
          <li key={w.id}>
            <Link to={`/app/patients/${w.id}`}>
              {w.fullName} ({w.code})
            </Link>
            {w.mobile ? ` · ${displayMobile(w.mobile)}` : ""} — {REASON[w.reason]}
          </li>
        ))}
      </ul>
      {ask ? (
        <div className="new-patient-same-person" role="alert">
          <p>
            <strong>Same person?</strong> Open the existing patient, or save this as a new patient.
          </p>
          <div className="form-actions">
            <Link
              className="btn btn-primary"
              to={`/app/patients/${best.id}`}
              onClick={onOpenExisting}
            >
              Open existing
            </Link>
            <button type="button" className="btn" onClick={onSaveAsNew}>
              Save as new patient
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
