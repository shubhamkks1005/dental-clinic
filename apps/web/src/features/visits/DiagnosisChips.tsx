import type { ListItem } from "@clinic/shared";
import { useState } from "react";
import { ApiError } from "../../api/client";
import { addVisitDiagnosis, type VisitDiagnosis } from "./api";

type Props = {
  visitId: string;
  diagnoses: VisitDiagnosis[];
  diagnosisList: ListItem[];
  readOnly: boolean;
  onAdded: (row: VisitDiagnosis) => void;
};

/** Diagnosis as chips. "+ Add" opens a search (list or free text) with an optional tooth. */
export function DiagnosisChips({ visitId, diagnoses, diagnosisList, readOnly, onAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tooth, setTooth] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = diagnosisList.filter((d) => d.active);
  const matches = active.filter((d) => d.label.toLowerCase().includes(query.trim().toLowerCase()));

  async function add() {
    const text = query.trim();
    if (!text) return;
    const hit = active.find((d) => d.label.toLowerCase() === text.toLowerCase());
    const toothNo = tooth.trim() ? Number(tooth.trim()) : null;
    setBusy(true);
    setError(null);
    try {
      const row = await addVisitDiagnosis(visitId, {
        listItemId: hit?.id ?? null,
        freeText: hit ? null : text,
        toothFdi: toothNo != null && Number.isFinite(toothNo) ? toothNo : null,
      });
      onAdded(row);
      setQuery("");
      setTooth("");
      setOpen(false);
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not add the diagnosis. Check the connection, then try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="v1-block" role="group" aria-label="Diagnosis">
      <h3 className="v1-label">Diagnosis</h3>
      <div className="v1-chips">
        {diagnoses.map((d) => (
          <span key={d.id} className="v1-pill is-info">
            {d.label}
            {d.toothFdi != null ? ` · tooth ${d.toothFdi}` : ""}
          </span>
        ))}
        {!readOnly && (
          <button
            type="button"
            className="v1-pill is-dashed"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            + Add
          </button>
        )}
      </div>
      {diagnoses.length === 0 && !open && <p className="muted small">None yet.</p>}
      {open && (
        <div className="v1-add-row">
          <input
            className="input"
            list="v1-dx-options"
            aria-label="Diagnosis"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search or enter free text"
            disabled={busy}
          />
          <datalist id="v1-dx-options">
            {matches.slice(0, 8).map((m) => (
              <option key={m.id} value={m.label} />
            ))}
          </datalist>
          <input
            className="input v1-tooth-input"
            aria-label="Tooth (FDI)"
            inputMode="numeric"
            value={tooth}
            onChange={(e) => setTooth(e.target.value)}
            placeholder="Tooth"
            disabled={busy}
          />
          <button
            type="button"
            className="btn"
            disabled={busy || !query.trim()}
            onClick={() => void add()}
          >
            Add
          </button>
        </div>
      )}
      {error && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
