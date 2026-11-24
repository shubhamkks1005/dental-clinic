import { formatRupees, planPhaseLabel, type ListItem } from "@clinic/shared";
import { useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { getList } from "../lists";
import { createPlanItem, type PlanItemRow } from "./api";
import { Select, TextInput } from "../../ui/form";

type Props = {
  patientId: string;
  visitId?: string | null;
  toothFdi: number | null;
  readOnly: boolean;
  onAdded: (row: PlanItemRow) => void;
};

/** 3.6.1: add plan item (procedure, estimate, phase, sittings) — S05/S06. */
export function PlanAddForm({ patientId, visitId, toothFdi, readOnly, onAdded }: Props) {
  const [list, setList] = useState<ListItem[]>([]);
  const [listItemId, setListItemId] = useState("");
  const [phase, setPhase] = useState(1);
  const [sittings, setSittings] = useState(1);
  const [estimatePaise, setEstimatePaise] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getList("procedures")
      .then((items) => {
        if (cancelled) return;
        const active = items.filter((i) => i.active);
        setList(active);
        const first = active[0];
        if (first) {
          setListItemId(first.id);
          const fee = typeof first.data.default_paise === "number" ? first.data.default_paise : 0;
          setEstimatePaise(fee);
        }
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function onPick(id: string) {
    setListItemId(id);
    const item = list.find((i) => i.id === id);
    const fee = typeof item?.data.default_paise === "number" ? item.data.default_paise : 0;
    setEstimatePaise(fee);
  }

  async function add() {
    const selected = list.find((i) => i.id === listItemId);
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const row = await createPlanItem({
        patientId,
        toothFdi,
        procedureLabel: selected.label,
        listItemId: selected.id,
        estimatePaise,
        phase,
        sittings,
        createdVisitId: visitId ?? null,
      });
      onAdded(row);
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not add to the plan. Check the connection, then try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (readOnly) return null;

  return (
    <section className="plan-add" aria-label="Add to plan">
      <h3 className="visit-section-title">Add to plan</h3>
      <p className="muted small">
        {toothFdi != null ? `Tooth ${toothFdi} selected.` : "No tooth selected (optional)."}
      </p>
      <div className="plan-add-row">
        <label>
          Procedure
          <Select value={listItemId} onChange={(e) => onPick(e.target.value)}>
            {list.map((i) => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </Select>
        </label>
        <label>
          Estimate (₹)
          <TextInput
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={Math.round(estimatePaise / 100)}
            onChange={(e) =>
              setEstimatePaise(Math.max(0, Math.round(Number(e.target.value) * 100)))
            }
          />
        </label>
        <label>
          Phase
          <Select value={phase} onChange={(e) => setPhase(Number(e.target.value))}>
            {[1, 2, 3, 4].map((p) => (
              <option key={p} value={p}>
                {p}. {planPhaseLabel(p)}
              </option>
            ))}
          </Select>
        </label>
        <label>
          Sittings
          <TextInput
            type="number"
            inputMode="numeric"
            min={1}
            max={20}
            value={sittings}
            onChange={(e) => setSittings(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
          />
        </label>
        <button type="button" className="btn primary" disabled={busy || !listItemId} onClick={add}>
          {busy ? "Saving…" : "Plan karo"}
        </button>
      </div>
      <p className="muted small">Usual fee shown as {formatRupees(estimatePaise)}.</p>
      {error ? <p className="form-error">{error}</p> : null}
    </section>
  );
}
