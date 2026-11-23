import { statusWord } from "@clinic/shared";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { copyPreviousPrescription, revisePrescription } from "./api";
import { RxLinesTable } from "./RxLinesTable";
import { useVisitPrescription } from "./useVisitPrescription";
import "./prescriptions.css";

type Props = {
  visitId: string;
  patientId: string;
  canWrite: boolean;
  /** Narrow side panel on the one-screen visit: the visit's own advice replaces the extra fields. */
  compact?: boolean;
  /** Lets the visit's Finalise bar show whether the prescription is issued. */
  onStatusChange?: (status: RxStatus) => void;
};

export type RxStatus = "none" | "draft" | "issued";

/** 4.2.2–4.2.7 prescription on the visit (S05). Keyboard-first add from the doctor list. */
export function VisitMedicinesPanel({
  visitId,
  patientId,
  canWrite,
  compact = false,
  onStatusChange,
}: Props) {
  const rxState = useVisitPrescription(visitId, patientId, canWrite);
  const { rx, lines, medicines, sets, locked, busy, problem, warnings } = rxState;
  const [query, setQuery] = useState("");
  const status: RxStatus = rx == null ? "none" : rx.status === "draft" ? "draft" : "issued";
  useEffect(() => {
    onStatusChange?.(status);
  }, [status]);

  const q = query.trim().toLowerCase();
  const filtered = medicines.filter((m) => {
    if (!q) return true;
    const brand = typeof m.data.brand === "string" ? m.data.brand : "";
    return m.label.toLowerCase().includes(q) || brand.toLowerCase().includes(q);
  });

  async function add(item: (typeof medicines)[number]) {
    await rxState.addMedicine(item);
    setQuery("");
  }

  if (!canWrite) {
    return (
      <p className="muted">
        Only the doctor can write prescriptions. Receptionist can print issued ones from History.
      </p>
    );
  }

  const printable = rx && (rx.status === "issued" || rx.status === "revised");

  return (
    <section className={`rx-panel${compact ? " is-compact" : ""}`} aria-label="Medicines">
      {problem && (
        <p className="notice notice-error" role="alert">
          {problem}
        </p>
      )}
      {warnings.map((w) => (
        <p key={w} className="notice notice-warn" role="status">
          {w}
        </p>
      ))}

      <div className="rx-toolbar">
        <label className="rx-search">
          <span className="visually-hidden">Search medicines</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && filtered[0]) {
                e.preventDefault();
                void add(filtered[0]);
              }
            }}
            placeholder="Search medicine (Enter to add)"
            disabled={locked || busy}
          />
        </label>
        {!compact && (
          <button
            type="button"
            className="btn"
            disabled={locked || busy}
            onClick={() => void copyPreviousPrescription(patientId, visitId).then(rxState.load)}
          >
            Copy previous
          </button>
        )}
        {locked ? (
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() => void revisePrescription(rx!.id).then(rxState.load)}
          >
            Revise
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || lines.length === 0}
            onClick={() => void rxState.onIssue()}
          >
            Issue
          </button>
        )}
        {printable && (
          <Link className="btn" to={`/app/print/prescription/${rx.id}`}>
            Print
          </Link>
        )}
      </div>

      {!locked && (q || !compact) && (
        <ul className="rx-suggest">
          {filtered.slice(0, 8).map((m) => (
            <li key={m.id}>
              <button type="button" className="btn btn-quiet" onClick={() => void add(m)}>
                <strong>{m.label}</strong>
                <span className="muted small">
                  {String(m.data.strength ?? "")} · {String(m.data.default_frequency ?? "")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!locked && sets.length > 0 && (
        <div className="rx-sets">
          {sets.map((s) => (
            <button
              key={s.id}
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => void rxState.applySet(s)}
            >
              {s.label}
            </button>
          ))}
          {compact && (
            <button
              type="button"
              className="btn"
              disabled={locked || busy}
              onClick={() => void copyPreviousPrescription(patientId, visitId).then(rxState.load)}
            >
              Copy previous
            </button>
          )}
        </div>
      )}

      <RxLinesTable
        lines={lines}
        locked={locked}
        busy={busy}
        onChange={rxState.setLines}
        onSave={(next) => void rxState.saveLines(next)}
      />

      {!compact && (
        <div className="rx-meta">
          <label>
            Advice
            <textarea
              value={rxState.advice}
              disabled={locked || busy}
              rows={2}
              onChange={(e) => rxState.setAdvice(e.target.value)}
              onBlur={() => void rxState.saveMeta()}
            />
          </label>
          <label>
            Follow-up date
            <input
              type="date"
              value={rxState.followUpOn}
              disabled={locked || busy}
              onChange={(e) => rxState.setFollowUpOn(e.target.value)}
              onBlur={() => void rxState.saveMeta()}
            />
          </label>
          <label>
            Weight (kg)
            <input
              inputMode="numeric"
              value={rxState.weightKg}
              disabled={locked || busy}
              onChange={(e) => rxState.setWeightKg(e.target.value)}
              onBlur={() => void rxState.saveMeta()}
            />
          </label>
        </div>
      )}

      {rx && (
        <p className="muted small">
          Status: {statusWord("visit", rx.status).label}
          {rx.rxNo ? ` · ${rx.rxNo}` : ""}
        </p>
      )}
    </section>
  );
}
