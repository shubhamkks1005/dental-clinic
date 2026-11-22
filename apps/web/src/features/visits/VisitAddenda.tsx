import { useState } from "react";
import { ApiError } from "../../api/client";
import { addVisitAddendum, getVisit, type VisitAddendum, type VisitSummary } from "./api";

type Props = {
  visit: VisitSummary;
  canEdit: boolean;
  onChanged: (visit: VisitSummary) => void;
};

/** 3.5.7: addenda under a finalised visit; entered-in-error voids it. */
export function VisitAddenda({ visit, canEdit, onChanged }: Props) {
  const [body, setBody] = useState("");
  const [reason, setReason] = useState("");
  const [asError, setAsError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (visit.status === "draft") return null;

  const addenda: VisitAddendum[] = visit.addenda ?? [];

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await addVisitAddendum(visit.id, {
        body: body.trim(),
        reason: reason.trim(),
        kind: asError ? "entered_in_error" : "note",
      });
      const fresh = await getVisit(visit.id);
      onChanged(fresh);
      setBody("");
      setReason("");
      setAsError(false);
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not save the addendum. Check the connection, then try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="visit-addenda" aria-label="Addenda">
      <h2 className="visit-section-title">Addenda</h2>
      {visit.status === "void" ? (
        <p className="notice notice-warning" role="status">
          Entered in error — original text kept; do not delete.
        </p>
      ) : null}
      {addenda.length === 0 ? (
        <p className="muted small">No addenda yet.</p>
      ) : (
        <ul className="visit-addenda-list">
          {addenda.map((a) => (
            <li key={a.id} className={a.kind === "entered_in_error" ? "is-error" : undefined}>
              <time dateTime={a.recordedAt}>{a.recordedAt.slice(0, 19).replace("T", " ")} UTC</time>
              <span className="visit-addenda-kind">
                {a.kind === "entered_in_error" ? "Entered in error" : "Note"}
              </span>
              <p>{a.body}</p>
              <p className="muted small">Reason: {a.reason}</p>
            </li>
          ))}
        </ul>
      )}
      {canEdit && visit.status !== "void" && (
        <div className="visit-addenda-form">
          <label className="visit-field">
            <span>Addendum</span>
            <textarea
              className="input"
              rows={2}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={busy}
            />
          </label>
          <label className="visit-field">
            <span>Reason</span>
            <input
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={busy}
            />
          </label>
          <label className="visit-check">
            <input
              type="checkbox"
              checked={asError}
              onChange={(e) => setAsError(e.target.checked)}
              disabled={busy}
            />
            Mark whole visit as entered in error
          </label>
          <button
            type="button"
            className="btn"
            disabled={busy || !body.trim() || !reason.trim()}
            onClick={() => void submit()}
          >
            Add addendum
          </button>
        </div>
      )}
      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
