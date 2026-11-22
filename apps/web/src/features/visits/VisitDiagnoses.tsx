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

/** 3.5.3: list or free-text diagnosis, optional FDI tooth. */
export function VisitDiagnoses({ visitId, diagnoses, diagnosisList, readOnly, onAdded }: Props) {
  const [query, setQuery] = useState("");
  const [tooth, setTooth] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = diagnosisList
    .filter((d) => d.active && d.label.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 8);

  async function add(opts: { listItemId?: string; freeText?: string }) {
    setBusy(true);
    setError(null);
    try {
      const toothFdi = tooth.trim() ? Number(tooth.trim()) : null;
      const row = await addVisitDiagnosis(visitId, {
        listItemId: opts.listItemId ?? null,
        freeText: opts.freeText ?? null,
        toothFdi: Number.isFinite(toothFdi) ? toothFdi : null,
      });
      onAdded(row);
      setQuery("");
      setTooth("");
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
    <section className="visit-dx" aria-label="Diagnoses">
      <h2 className="visit-section-title">Diagnosis</h2>
      {diagnoses.length === 0 ? (
        <p className="muted small">None yet.</p>
      ) : (
        <ul className="visit-dx-list">
          {diagnoses.map((d) => (
            <li key={d.id}>
              {d.label}
              {d.toothFdi != null ? ` · tooth ${d.toothFdi}` : ""}
            </li>
          ))}
        </ul>
      )}
      {!readOnly && (
        <div className="visit-dx-add">
          <label className="visit-field">
            <span>Add diagnosis</span>
            <input
              className="input"
              list="visit-dx-options"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search or enter free text"
              disabled={busy}
            />
            <datalist id="visit-dx-options">
              {matches.map((m) => (
                <option key={m.id} value={m.label} />
              ))}
            </datalist>
          </label>
          <label className="visit-field visit-field-narrow">
            <span>Tooth (FDI)</span>
            <input
              className="input"
              inputMode="numeric"
              value={tooth}
              onChange={(e) => setTooth(e.target.value)}
              placeholder="36"
              disabled={busy}
            />
          </label>
          <button
            type="button"
            className="btn"
            disabled={busy || !query.trim()}
            onClick={() => {
              const hit = diagnosisList.find(
                (d) => d.active && d.label.toLowerCase() === query.trim().toLowerCase(),
              );
              void add(hit ? { listItemId: hit.id } : { freeText: query.trim() });
            }}
          >
            Add
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
