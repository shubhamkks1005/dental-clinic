import {
  formatRupees,
  TOOTH_SURFACE_LABEL,
  type FdiTooth,
  type ListItem,
  type ToothSurface,
} from "@clinic/shared";
import { useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { getList } from "../lists";
import { addVisitProcedure, type VisitProcedure } from "./api";

export type ChartSelection = {
  tooth: FdiTooth;
  surfaces: ToothSurface[];
};

type Props = {
  visitId: string;
  procedures: VisitProcedure[];
  selection: ChartSelection | null;
  readOnly: boolean;
  onAdded: (row: VisitProcedure) => void;
  /** Replaces the "click a tooth" line where there is no chart on the screen. */
  selectionHint?: string;
};

/** 3.5.4: add procedure using chart tooth/surface selection (S05 Chart tab). */
export function VisitProcedures({
  visitId,
  procedures,
  selection,
  readOnly,
  onAdded,
  selectionHint,
}: Props) {
  const [list, setList] = useState<ListItem[]>([]);
  const [listItemId, setListItemId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getList("procedures")
      .then((items) => {
        if (cancelled) return;
        const active = items.filter((i) => i.active);
        // Q1.8: nothing is pre-selected, so Add cannot silently put a billable item on the visit.
        setList(active);
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = list.find((i) => i.id === listItemId);
  const feePaise =
    typeof selected?.data.default_paise === "number" ? selected.data.default_paise : null;

  async function add() {
    if (!listItemId) return;
    setBusy(true);
    setError(null);
    try {
      const row = await addVisitProcedure(visitId, {
        listItemId,
        toothFdi: selection?.tooth ?? null,
        surfaces: selection?.surfaces ?? [],
        note: note.trim() || null,
      });
      onAdded(row);
      setNote("");
      setListItemId("");
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not add the procedure. Check the connection, then try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="visit-proc" aria-label="Procedures">
      <h2 className="visit-section-title">Procedures</h2>
      {procedures.length === 0 ? (
        <p className="muted small">
          None yet. Pick a procedure and press Add. The bill is made from these.
        </p>
      ) : (
        <ul className="visit-proc-list">
          {procedures.map((p) => (
            <li key={p.id}>
              {p.label}
              {p.toothFdi != null ? ` · tooth ${p.toothFdi}` : ""}
              {p.surfaces.length > 0
                ? ` · ${p.surfaces.map((s) => TOOTH_SURFACE_LABEL[s]).join("")}`
                : ""}
              {p.defaultPaise != null ? ` · ${formatRupees(p.defaultPaise)}` : ""}
              {p.note ? ` — ${p.note}` : ""}
            </li>
          ))}
        </ul>
      )}
      {!readOnly && (
        <div className="visit-proc-add">
          <p className="muted small">
            {selection
              ? `Chart selection: tooth ${selection.tooth} · ${selection.surfaces
                  .map((s) => TOOTH_SURFACE_LABEL[s])
                  .join(", ")}`
              : (selectionHint ?? "Chart selection: click a tooth surface on the chart first")}
          </p>
          <label className="visit-field">
            <span>Procedure</span>
            <select
              className="input"
              value={listItemId}
              onChange={(e) => setListItemId(e.target.value)}
              disabled={busy}
            >
              <option value="">Choose a procedure…</option>
              {list.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                  {typeof i.data.default_paise === "number"
                    ? ` (${formatRupees(i.data.default_paise)})`
                    : ""}
                </option>
              ))}
            </select>
          </label>
          {feePaise != null ? (
            <p className="muted small">Usual fee: {formatRupees(feePaise)} (billing later)</p>
          ) : null}
          <label className="visit-field">
            <span>Note</span>
            <input
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={busy}
            />
          </label>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || !listItemId}
            onClick={() => void add()}
          >
            Add procedure
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
