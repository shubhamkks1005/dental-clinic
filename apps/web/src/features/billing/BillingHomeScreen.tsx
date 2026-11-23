import { formatRupees, type DueAgeBucket } from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { DailyClosePanel } from "./DailyClosePanel";
import { listDues, recordDuesCall, type DuesRow } from "./api";

const BUCKET_LABEL: Record<DueAgeBucket, string> = {
  "0-30": "0–30 days",
  "31-60": "31–60 days",
  "61+": "Over 60 days",
};

/** S09 Billing home: outstanding dues by age (5.3.4). */
export function BillingHomeScreen() {
  const [rows, setRows] = useState<DuesRow[]>([]);
  const [total, setTotal] = useState(0);
  const [byBucket, setByBucket] = useState<Record<DueAgeBucket, number>>({
    "0-30": 0,
    "31-60": 0,
    "61+": 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    listDues()
      .then((r) => {
        setRows(r.rows);
        setTotal(r.totalDuePaise);
        setByBucket(r.byBucket);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Could not load dues.");
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveCall(patientId: string) {
    setSaving(true);
    setError(null);
    try {
      await recordDuesCall(patientId, note);
      setNote("");
      setNoteFor(null);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not save call note.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="stack gap-md" aria-label="Billing">
      <header className="stack gap-xs">
        <h1 className="title-md">Outstanding dues</h1>
        <p className="muted">
          Total: <strong>{formatRupees(total)}</strong>
        </p>
      </header>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="row wrap gap-sm">
        {(Object.keys(BUCKET_LABEL) as DueAgeBucket[]).map((b) => (
          <p key={b} className="surface card-pad muted small">
            {BUCKET_LABEL[b]}: {formatRupees(byBucket[b])}
          </p>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="muted">No outstanding dues.</p>
      ) : (
        <ul className="stack gap-sm list-plain">
          {rows.map((r) => (
            <li key={r.patientId} className="surface card-pad stack gap-sm">
              <div className="row wrap gap-sm space-between">
                <div className="stack gap-xs">
                  <Link to={`/app/patients/${r.patientId}?tab=billing`}>
                    {r.patientName} · {r.patientCode}
                  </Link>
                  <span className="muted small">
                    {BUCKET_LABEL[r.bucket]} · {r.daysOutstanding} days · oldest {r.oldestBillOn}
                  </span>
                  {r.lastCallNote ? (
                    <span className="muted small">
                      Last call ({r.lastCallOn}): {r.lastCallNote}
                    </span>
                  ) : null}
                </div>
                <strong>{formatRupees(r.duePaise)}</strong>
              </div>
              {noteFor === r.patientId ? (
                <div className="stack gap-sm">
                  <label className="stack gap-xs">
                    <span className="muted small">Call note</span>
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={500}
                      style={{ minHeight: 44 }}
                    />
                  </label>
                  <div className="row wrap gap-sm">
                    <button
                      type="button"
                      className="btn"
                      disabled={saving || note.trim().length === 0}
                      onClick={() => void saveCall(r.patientId)}
                    >
                      Save note
                    </button>
                    <button
                      type="button"
                      className="btn secondary"
                      disabled={saving}
                      onClick={() => {
                        setNoteFor(null);
                        setNote("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn secondary"
                  style={{ alignSelf: "start", minHeight: 44 }}
                  onClick={() => {
                    setNoteFor(r.patientId);
                    setNote("");
                  }}
                >
                  Add call note
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <p>
        <Link to="/app/patients" className="btn secondary">
          Find a patient
        </Link>
      </p>

      <DailyClosePanel />
    </section>
  );
}
