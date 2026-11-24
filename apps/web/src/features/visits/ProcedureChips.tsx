import { TOOTH_SURFACE_LABEL, type ListItem } from "@clinic/shared";
import { useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { formatMoney } from "../../ui/format";
import { useRequestScope } from "../../ui/RequestScope";
import { addVisitProcedure, type VisitProcedure } from "./api";
import type { ChartSelection } from "./chart-selection";
import { listOnce } from "./visit-prefetch";
import { Select } from "../../ui/form";

type Props = {
  visitId: string;
  procedures: VisitProcedure[];
  /** Tooth picked on the chart; the next procedure is added for it. */
  selection: ChartSelection | null;
  readOnly: boolean;
  onAdded: (row: VisitProcedure) => void;
};

const QUICK_COUNT = 5;

function chipText(p: VisitProcedure): string {
  const tooth = p.toothFdi != null ? ` · tooth ${p.toothFdi}` : "";
  const surf =
    p.surfaces.length > 0 ? ` ${p.surfaces.map((s) => TOOTH_SURFACE_LABEL[s]).join("")}` : "";
  const fee = p.defaultPaise != null ? ` · ${formatMoney(p.defaultPaise)}` : "";
  return `${p.label}${tooth}${surf}${fee}`;
}

/** Procedures done: chips with fees, quick picks and "+ Add". The bill is made from these. */
export function ProcedureChips({ visitId, procedures, selection, readOnly, onAdded }: Props) {
  const scope = useRequestScope();
  const [list, setList] = useState<ListItem[]>([]);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listOnce(scope, "procedures")
      .then((items) => {
        if (!cancelled) setList(items.filter((i) => i.active));
      })
      .catch(() => {
        /* the chips already added still show */
      });
    return () => {
      cancelled = true;
    };
  }, [scope]);

  async function add(listItemId: string) {
    if (!listItemId || busy) return;
    setBusy(true);
    setError(null);
    try {
      const row = await addVisitProcedure(visitId, {
        listItemId,
        toothFdi: selection?.tooth ?? null,
        surfaces: selection?.surfaces ?? [],
        note: null,
      });
      onAdded(row);
      setMore(false);
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
    <div className="v1-block" role="group" aria-label="Procedures done">
      <h3 className="v1-label">Procedures done</h3>
      <div className="v1-chips">
        {procedures.map((p) => (
          <span key={p.id} className="v1-pill is-on">
            {chipText(p)}
          </span>
        ))}
        {!readOnly &&
          list.slice(0, QUICK_COUNT).map((i) => (
            <button
              key={i.id}
              type="button"
              className="v1-pill"
              disabled={busy}
              onClick={() => void add(i.id)}
            >
              {i.label}
            </button>
          ))}
        {!readOnly && list.length > QUICK_COUNT && (
          <button
            type="button"
            className="v1-pill is-dashed"
            aria-expanded={more}
            onClick={() => setMore((v) => !v)}
          >
            + Add
          </button>
        )}
      </div>
      {procedures.length === 0 && (
        <p className="muted small">None yet. The bill is made from these.</p>
      )}
      {!readOnly && selection && (
        <p className="muted small">
          Tooth {selection.tooth} is picked on the chart. The next procedure is added for it.
        </p>
      )}
      {more && (
        <Select
          className="input v1-select"
          autoFocus
          aria-label="More procedures"
          value=""
          disabled={busy}
          onChange={(e) => void add(e.target.value)}
        >
          <option value="">Choose a procedure…</option>
          {list.map((i) => (
            <option key={i.id} value={i.id}>
              {i.label}
              {typeof i.data.default_paise === "number"
                ? ` (${formatMoney(i.data.default_paise)})`
                : ""}
            </option>
          ))}
        </Select>
      )}
      {error && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
