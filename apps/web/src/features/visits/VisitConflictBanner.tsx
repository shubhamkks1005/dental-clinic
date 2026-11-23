import { CopyButton } from "../../ui/CopyButton";
import { notesAsText, type NotesSnapshot } from "./visit-autosave";

/** Q1.6: autosave stopped on a version conflict. The text stays; the doctor copies and reloads. */
export function VisitConflictBanner({ form }: { form: NotesSnapshot }) {
  return (
    <div className="notice notice-error stack gap-sm" role="alert">
      <p>
        This visit was changed in another tab or by someone else. Your text is kept below. Copy it,
        reload the visit, then add what is missing.
      </p>
      <div className="row wrap gap-sm">
        <CopyButton text={notesAsText(form)} label="Copy my text" />
        <button type="button" className="btn" onClick={() => window.location.reload()}>
          Reload visit
        </button>
      </div>
    </div>
  );
}
