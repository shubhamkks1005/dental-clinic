import { statusWord } from "@clinic/shared";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { copyPreviousPrescription, revisePrescription } from "./api";
import { AddMedicineInline } from "./AddMedicineInline";
import { RxLinesTable } from "./RxLinesTable";
import { RxMetaFields } from "./RxMetaFields";
import { useVisitPrescription } from "./useVisitPrescription";
import "./prescriptions.css";
import { TextInput } from "../../ui/form";

type Props = {
  visitId: string;
  patientId: string;
  canWrite: boolean;
  /** Narrow side panel on the one-screen visit: the visit's own advice replaces the extra fields. */
  compact?: boolean;
  /** Lets the visit's Finalise bar show whether the prescription is issued. */
  onStatusChange?: (status: RxStatus) => void;
  /** The visit page shows a live sheet of the same prescription. */
  onSnapshot?: (snapshot: RxSnapshot) => void;
};

export type RxStatus = "none" | "draft" | "issued";

/** What the live prescription preview next to the visit needs, handed out whenever it changes. */
export type RxSnapshot = {
  status: RxStatus;
  rxNo: string | null;
  lines: Array<{
    key: string;
    genericName: string;
    brand: string;
    strength: string;
    frequency: string;
    days: string;
    timing: string;
    instruction: string;
  }>;
  advice: string;
  followUpOn: string;
};

/** 4.2.2–4.2.7 prescription on the visit (S05). Keyboard-first add from the doctor list. */
export function VisitMedicinesPanel({
  visitId,
  patientId,
  canWrite,
  compact = false,
  onStatusChange,
  onSnapshot,
}: Props) {
  const rxState = useVisitPrescription(visitId, patientId, canWrite);
  const { rx, lines, medicines, sets, locked, busy, problem, warnings } = rxState;
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [active, setActive] = useState(0);
  const [undo, setUndo] = useState<{ text: string; before: typeof lines } | null>(null);
  const undoTimer = useRef<number | undefined>(undefined);
  const status: RxStatus = rx == null ? "none" : rx.status === "draft" ? "draft" : "issued";
  useEffect(() => {
    onStatusChange?.(status);
  }, [status]);
  const { advice, followUpOn } = rxState;
  useEffect(() => {
    onSnapshot?.({
      status,
      rxNo: rx?.rxNo ?? null,
      lines: lines.map((l) => ({
        key: l.key,
        genericName: l.genericName,
        brand: l.brand ?? "",
        strength: l.strength ?? "",
        frequency: l.frequency,
        days: l.days,
        timing: l.timing,
        instruction: l.instruction ?? "",
      })),
      advice,
      followUpOn,
    });
  }, [status, rx?.rxNo, lines, advice, followUpOn]);

  const q = query.trim().toLowerCase();
  const filtered = medicines.filter((m) => {
    if (!q) return true;
    const brand = typeof m.data.brand === "string" ? m.data.brand : "";
    return m.label.toLowerCase().includes(q) || brand.toLowerCase().includes(q);
  });

  async function add(item: (typeof medicines)[number]) {
    const before = lines;
    await rxState.addMedicine(item);
    setQuery("");
    setActive(0);
    // One step of Undo for 6 seconds, the same words and time as the diagnosis and procedure lines.
    window.clearTimeout(undoTimer.current);
    setUndo({ text: `Added: ${item.label}`, before });
    undoTimer.current = window.setTimeout(() => setUndo(null), 6000);
  }

  async function undoAdd() {
    if (!undo) return;
    window.clearTimeout(undoTimer.current);
    const prev = undo.before;
    setUndo(null);
    rxState.setLines(prev);
    await rxState.saveLines(prev);
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
          <TextInput
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              const shown = Math.min(filtered.length, 8);
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                if (shown > 0) {
                  setActive((a) => (a + (e.key === "ArrowDown" ? 1 : -1) + shown) % shown);
                }
              } else if (e.key === "Enter" && filtered[Math.min(active, shown - 1)]) {
                e.preventDefault();
                void add(filtered[Math.min(active, shown - 1)] as (typeof filtered)[number]);
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
          {filtered.slice(0, 8).map((m, i) => (
            <li key={m.id}>
              <button
                type="button"
                className={`btn btn-quiet${i === active && q ? " is-active" : ""}`}
                aria-selected={i === active && !!q}
                onClick={() => void add(m)}
              >
                <strong>{m.label}</strong>
                <span className="muted small">
                  {String(m.data.strength ?? "")} · {String(m.data.default_frequency ?? "")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {undo && (
        <div className="rx-undo" role="status">
          <span>{undo.text}</span>
          <button type="button" className="btn" onClick={() => void undoAdd()}>
            Undo
          </button>
        </div>
      )}

      {!locked && q && filtered.length === 0 && !adding && (
        <button type="button" className="btn" onClick={() => setAdding(true)}>
          + Add “{query.trim()}” to my list
        </button>
      )}
      {!locked && adding && (
        <AddMedicineInline
          name={query}
          onCancel={() => setAdding(false)}
          onAdded={(item) => {
            setAdding(false);
            void rxState.load().then(() => add(item));
          }}
        />
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

      {compact ? (
        <details className="v1-more">
          <summary>More: advice, follow-up, weight</summary>
          <RxMetaFields rx={rxState} locked={locked} busy={busy} />
        </details>
      ) : (
        <RxMetaFields rx={rxState} locked={locked} busy={busy} />
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
