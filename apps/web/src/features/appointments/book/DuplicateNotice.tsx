import { displayMobile } from "@clinic/shared";
import type { DuplicateWarning } from "../../patients/api";

// Owner Q5 (2026-11-26): same first name + mobile asks "Same person?"; the same mobile alone is a
// quiet line (families share one phone, L35). Neither blocks saving.
export function DuplicateNotice({
  warnings,
  ask,
  onPick,
  onSaveAsNew,
}: {
  warnings: DuplicateWarning[];
  /** Save was pressed with a "Same person?" match on screen. */
  ask: boolean;
  onPick: (w: DuplicateWarning) => void;
  onSaveAsNew: () => void;
}) {
  const same = warnings.filter((w) => w.reason === "first_name_mobile");
  const quiet = warnings.filter((w) => w.reason === "mobile_only");
  const best = same[0];
  if (best) {
    return (
      <div className={`bk-same${ask ? " is-asking" : ""}`} role={ask ? "alert" : "status"}>
        <p>
          <strong>Same person?</strong> {best.fullName} {best.code}
          {best.mobile ? ` ${displayMobile(best.mobile)}` : ""}
        </p>
        <div className="bk-same-actions">
          <button type="button" className="bk-btn bk-btn-primary" onClick={() => onPick(best)}>
            Open existing
          </button>
          <button type="button" className="bk-btn" onClick={onSaveAsNew}>
            Save as new patient
          </button>
        </div>
      </div>
    );
  }
  if (quiet.length === 0) return null;
  return (
    <p className="bk-quiet" role="status">
      Same mobile:{" "}
      {quiet.map((w, i) => (
        <span key={w.id}>
          {i > 0 ? ", " : ""}
          {w.fullName} {w.code}{" "}
          <button type="button" className="bk-text-link" onClick={() => onPick(w)}>
            Open
          </button>
        </span>
      ))}
    </p>
  );
}
