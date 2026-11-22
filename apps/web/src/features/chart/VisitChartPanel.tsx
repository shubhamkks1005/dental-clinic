import {
  chartConditionsFromList,
  conditionAllowsSurface,
  conditionColorMap,
  DEFAULT_CHART_VIEW,
  istDate,
  type ChartCondition,
  type ChartView,
  type FdiTooth,
  type ToothSurface,
} from "@clinic/shared";
import { useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { getList } from "../lists";
import {
  addChartEvent,
  getPatientChart,
  loadChartView,
  openDraftVisit,
  type PatientChart,
} from "./api";
import { ToothChart } from "./ToothChart";

type Props = {
  patientId: string;
  canEdit: boolean;
};

/** 3.4.5: live chart + as-of history dropdown. Opens a draft visit when applying (S05 chart). */
export function VisitChartPanel({ patientId, canEdit }: Props) {
  const [chart, setChart] = useState<PatientChart | null>(null);
  const [conditions, setConditions] = useState<ChartCondition[]>([]);
  const [view, setView] = useState<ChartView>(DEFAULT_CHART_VIEW);
  const [applyCode, setApplyCode] = useState("filling");
  const [asOfVisitId, setAsOfVisitId] = useState("");
  const [draftVisitId, setDraftVisitId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    Promise.all([
      getPatientChart(patientId, {
        asOfVisitId: asOfVisitId || undefined,
        highlightVisitId: draftVisitId ?? undefined,
      }),
      getList("conditions"),
      loadChartView().catch(() => null),
    ])
      .then(([next, list, setting]) => {
        if (cancelled) return;
        setChart(next);
        const conds = chartConditionsFromList(list);
        setConditions(conds);
        setApplyCode((prev) =>
          conds.some((c) => c.code === prev) ? prev : (conds[0]?.code ?? prev),
        );
        if (setting) setView(setting);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load the tooth chart. Check the connection, then try again.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [patientId, asOfVisitId, draftVisitId]);

  async function ensureDraft(): Promise<string> {
    if (draftVisitId) return draftVisitId;
    const visit = await openDraftVisit(patientId, istDate(new Date()));
    setDraftVisitId(visit.id);
    return visit.id;
  }

  async function onApply(tooth: FdiTooth, surface: ToothSurface, conditionCode: string) {
    if (!canEdit || asOfVisitId) return;
    const cond = conditions.find((c) => c.code === conditionCode);
    if (cond && !conditionAllowsSurface(cond, surface)) return;
    setBusy(true);
    setError(null);
    try {
      const visitId = await ensureDraft();
      const reply = await addChartEvent(patientId, {
        visitId,
        toothFdi: tooth,
        surface,
        conditionCode,
      });
      setChart(reply.chart);
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not save the chart change. Check the connection, then try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  const colorsByCode = conditionColorMap(conditions);
  const readOnly = !!asOfVisitId || !canEdit;

  return (
    <div className="visit-chart-panel">
      <div className="visit-chart-toolbar">
        <label>
          Chart as of
          <select
            value={asOfVisitId}
            onChange={(e) => setAsOfVisitId(e.target.value)}
            disabled={busy}
          >
            <option value="">Today (current)</option>
            {(chart?.history ?? []).map((h) => (
              <option key={h.id} value={h.id}>
                {h.visitDateLocal}
              </option>
            ))}
          </select>
        </label>
        {canEdit && !asOfVisitId && conditions.length > 0 && (
          <label>
            Apply condition
            <select
              value={applyCode}
              onChange={(e) => setApplyCode(e.target.value)}
              disabled={busy}
            >
              {conditions.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.icon} · {c.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {error && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}
      {readOnly && (
        <p className="muted small">
          {asOfVisitId ? "Viewing a past finalised chart (read-only)." : "Chart is read-only."}
        </p>
      )}
      {chart && (
        <ToothChart
          view={view}
          cells={chart.cells}
          colorsByCode={colorsByCode}
          applyCondition={applyCode}
          onApply={readOnly ? undefined : onApply}
          legend={conditions.map((c) => ({
            code: c.code,
            label: c.label,
            color: c.color,
            icon: c.icon,
          }))}
        />
      )}
      {!chart && !error && <p className="muted">Loading chart…</p>}
    </div>
  );
}
