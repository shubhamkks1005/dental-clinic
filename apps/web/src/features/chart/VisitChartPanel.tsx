import {
  ageYearsOn,
  chartConditionsFromList,
  conditionAllowsSurface,
  conditionColorMap,
  DEFAULT_CHART_VIEW,
  DENTITION_LABEL,
  dentitionFromAgeYears,
  istDate,
  type ChartCondition,
  type ChartView,
  type DentitionView,
  type FdiTooth,
  type ToothSurface,
} from "@clinic/shared";
import { useEffect, useMemo, useState } from "react";
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
import { Select } from "../../ui/form";

type Props = {
  patientId: string;
  canEdit: boolean;
  dateOfBirth?: string | null;
  ageYearsAtReg?: number | null;
  registeredOn?: string;
  /** When set (visit screen), chart events bind to this draft instead of opening another. */
  visitId?: string | null;
  onFocusChange?: (tooth: FdiTooth, surface: ToothSurface) => void;
};

/** 3.4.5–3.4.6: live chart, as-of history, age-based dentition with manual override (S05). */
export function VisitChartPanel({
  patientId,
  canEdit,
  dateOfBirth = null,
  ageYearsAtReg = null,
  registeredOn,
  visitId = null,
  onFocusChange,
}: Props) {
  const [chart, setChart] = useState<PatientChart | null>(null);
  const [conditions, setConditions] = useState<ChartCondition[]>([]);
  const [view, setView] = useState<ChartView>(DEFAULT_CHART_VIEW);
  const [applyCode, setApplyCode] = useState("filling");
  const [asOfVisitId, setAsOfVisitId] = useState("");
  const [draftVisitId, setDraftVisitId] = useState<string | null>(visitId);
  const [dentitionOverride, setDentitionOverride] = useState<DentitionView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visitId) setDraftVisitId(visitId);
  }, [visitId]);

  const todayLocal = istDate(new Date());
  const ageYears = useMemo(
    () =>
      ageYearsOn(
        {
          dateOfBirth,
          ageYearsAtReg,
          registeredOn: registeredOn ?? todayLocal,
        },
        todayLocal,
      ),
    [dateOfBirth, ageYearsAtReg, registeredOn, todayLocal],
  );
  const defaultDentition = dentitionFromAgeYears(ageYears);
  const dentition = dentitionOverride ?? defaultDentition;

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
          <Select
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
          </Select>
        </label>
        {canEdit && !asOfVisitId && conditions.length > 0 && (
          <label>
            Apply condition
            <Select
              value={applyCode}
              onChange={(e) => setApplyCode(e.target.value)}
              disabled={busy}
            >
              {conditions.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.icon} · {c.label}
                </option>
              ))}
            </Select>
          </label>
        )}
        <label>
          Dentition
          <Select
            value={dentition}
            onChange={(e) => setDentitionOverride(e.target.value as DentitionView)}
            disabled={busy}
          >
            {(Object.keys(DENTITION_LABEL) as DentitionView[]).map((key) => (
              <option key={key} value={key}>
                {DENTITION_LABEL[key]}
                {key === defaultDentition ? " (from age)" : ""}
              </option>
            ))}
          </Select>
        </label>
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
          dentition={dentition}
          view={view}
          cells={chart.cells}
          colorsByCode={colorsByCode}
          applyCondition={applyCode}
          onApply={readOnly ? undefined : onApply}
          onFocusChange={onFocusChange}
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
