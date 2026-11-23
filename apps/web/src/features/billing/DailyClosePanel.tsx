import { formatRupees, istDate } from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { useMe } from "../auth";
import { closeDay, getDayClose, reopenDay, type DayCloseSummary } from "./api";

/** 5.3.9: daily cash close by mode + counted cash. */
export function DailyClosePanel() {
  const me = useMe();
  const [dayLocal, setDayLocal] = useState(() => istDate(new Date()));
  const [summary, setSummary] = useState<DayCloseSummary | null>(null);
  const [counted, setCounted] = useState("");
  const [note, setNote] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    getDayClose(dayLocal)
      .then((s) => {
        setSummary(s);
        setCounted(String(Math.round(s.cashExpectedPaise / 100)));
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Could not load day close.");
      });
  }, [dayLocal]);

  useEffect(() => {
    load();
  }, [load]);

  async function onClose() {
    const cashCountedPaise = Math.round(Number(counted) * 100);
    if (!Number.isFinite(cashCountedPaise) || cashCountedPaise < 0) {
      setError("Enter the counted cash amount.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setSummary(await closeDay({ dayLocal, cashCountedPaise, note }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not close the day.");
    } finally {
      setBusy(false);
    }
  }

  async function onReopen() {
    if (reopenReason.trim().length === 0) {
      setError("Enter a reason to reopen.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setSummary(await reopenDay(dayLocal, reopenReason.trim()));
      setReopenReason("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not reopen the day.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="stack gap-md" aria-label="Daily cash close">
      <header className="row wrap gap-sm space-between align-center">
        <h2 className="title-sm">Daily cash close</h2>
        <label className="stack gap-xs">
          <span className="muted small">Day</span>
          <input
            type="date"
            value={dayLocal}
            onChange={(e) => setDayLocal(e.target.value)}
            style={{ minHeight: 44 }}
          />
        </label>
      </header>
      {error ? <p className="error-text">{error}</p> : null}
      {summary ? (
        <>
          <div className="row wrap gap-sm">
            {Object.entries(summary.modeTotals).map(([m, paise]) =>
              paise > 0 ? (
                <p key={m} className="surface card-pad muted small">
                  {m}: {formatRupees(paise)}
                </p>
              ) : null,
            )}
          </div>
          <p className="muted">
            Cash expected: <strong>{formatRupees(summary.cashExpectedPaise)}</strong> · Digital:{" "}
            <strong>{formatRupees(summary.digitalPaise)}</strong> · {summary.paymentCount} payments
          </p>
          {summary.closed && summary.close ? (
            <div className="stack gap-sm">
              <p>
                Closed. Counted {formatRupees(summary.close.cashCountedPaise)} · Difference{" "}
                {formatRupees(summary.close.differencePaise)}
                {summary.close.note ? ` · ${summary.close.note}` : ""}
              </p>
              <Link
                className="btn secondary"
                to={`/app/print/day-close?date=${encodeURIComponent(dayLocal)}`}
                target="_blank"
                rel="noreferrer"
              >
                Print day close
              </Link>
              {me.role === "doctor" ? (
                <div className="stack gap-sm">
                  <input
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    placeholder="Reason to reopen"
                    style={{ minHeight: 44 }}
                  />
                  <button
                    type="button"
                    className="btn secondary"
                    disabled={busy}
                    onClick={() => void onReopen()}
                  >
                    Reopen day
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="stack gap-sm">
              {summary.incompleteAppointments.length > 0 ? (
                <div className="notice warning stack gap-xs">
                  <p>
                    {summary.incompleteAppointments.length} open appointment
                    {summary.incompleteAppointments.length === 1 ? "" : "s"} must be finished,
                    marked no-show, or cancelled before close.
                  </p>
                  <ul className="muted small">
                    {summary.incompleteAppointments.map((a) => (
                      <li key={a.id}>
                        <Link to={`/app/patients/${a.patientId}?tab=appointments`}>
                          {a.patientName}
                        </Link>{" "}
                        · {a.visitTypeLabel} · {a.status.replace("_", " ")}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <label className="stack gap-xs">
                <span className="muted small">Counted cash (₹)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={counted}
                  onChange={(e) => setCounted(e.target.value)}
                  style={{ minHeight: 44 }}
                />
              </label>
              <label className="stack gap-xs">
                <span className="muted small">Note (required if difference ≠ 0)</span>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={500}
                  style={{ minHeight: 44 }}
                />
              </label>
              <button
                type="button"
                className="btn"
                disabled={busy || summary.incompleteAppointments.length > 0}
                onClick={() => void onClose()}
              >
                Close day
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="muted">Loading…</p>
      )}
    </section>
  );
}
