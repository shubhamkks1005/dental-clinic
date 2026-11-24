import { plural } from "../../ui/format";
import { formatRupees, planPhaseLabel } from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../../api/client";
import { listPlanItems, type PlanItem } from "./api";
import { PlanAddForm } from "./PlanAddForm";
import { PlanItemRow } from "./PlanItemRow";
import "./plan.css";

type Props = {
  patientId: string;
  visitId: string;
  canEdit: boolean;
  /** FDI tooth from the Chart tab focus, if any. */
  toothFdi: number | null;
};

/** 3.6.1–3.6.2: plan by phase with totals (S05 Plan tab / S06). */
export function VisitPlanPanel({ patientId, visitId, canEdit, toothFdi }: Props) {
  const [items, setItems] = useState<PlanItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    listPlanItems(patientId)
      .then(setItems)
      .catch((err: unknown) => {
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load the plan. Check the connection, then try again.",
        );
      })
      .finally(() => setLoading(false));
  }, [patientId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const phases = [1, 2, 3, 4];
  const totalPaise = items.reduce((sum, i) => sum + i.estimatePaise, 0);

  return (
    <div className="visit-plan">
      <PlanAddForm
        patientId={patientId}
        visitId={visitId}
        toothFdi={toothFdi}
        readOnly={!canEdit}
        onAdded={() => reload()}
      />
      <p className="plan-total">
        Plan total: <strong>{formatRupees(totalPaise)}</strong>
        {loading ? " · Loading…" : ` · ${plural(items.length, "item")}`}
        {canEdit ? (
          <>
            {" · "}
            <Link to={`/app/print/estimate/${encodeURIComponent(patientId)}`}>Print estimate</Link>
          </>
        ) : null}
      </p>
      {error ? <p className="form-error">{error}</p> : null}
      {phases.map((phase) => {
        const group = items.filter((i) => i.phase === phase);
        if (group.length === 0) return null;
        const sub = group.reduce((s, i) => s + i.estimatePaise, 0);
        return (
          <section key={phase} className="plan-phase" aria-label={planPhaseLabel(phase)}>
            <h3 className="visit-section-title">
              {phase}. {planPhaseLabel(phase)}{" "}
              <span className="muted small">({formatRupees(sub)})</span>
            </h3>
            <ul className="plan-item-list">
              {group.map((item) => (
                <PlanItemRow key={item.id} item={item} canEdit={canEdit} onChanged={reload} />
              ))}
            </ul>
          </section>
        );
      })}
      {!loading && items.length === 0 ? (
        <p className="muted">No plan items yet. Select a tooth on Chart, then Plan karo here.</p>
      ) : null}
    </div>
  );
}
