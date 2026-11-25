import {
  ageYearsOn,
  chartConditionsFromList,
  conditionAllowsSurface,
  conditionColorMap,
  DEFAULT_CHART_VIEW,
  DENTITION_LABEL,
  dentitionFromAgeYears,
  istDate,
  type ChartView,
  type DentitionView,
  type FdiTooth,
  type ListItem,
} from "@clinic/shared";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Select } from "../../ui/form";
import { ToothChart } from "../chart";
import { loadChartView } from "../chart/api";
import { affectedTeeth, chartBadge, chartSaveText } from "./chart-model";
import { padButtons } from "./pad-model";
import { ToothCard } from "./ToothCard";
import { useChartMarks } from "./useChartMarks";

type Props = {
  patientId: string;
  visitId: string;
  canEdit: boolean;
  dateOfBirth: string | null;
  ageYearsAtReg: number | null;
  registeredOn: string;
  conditions: ListItem[];
  selected: number | null;
  onSelect: (fdi: FdiTooth) => void;
  /** Marks were saved: the badge and the tooth card refresh. */
  onSaved: () => void;
  onBadge: (text: string) => void;
  /** Changes when this visit saved a line or file: the tooth card reads the tooth again. */
  refreshKey: number;
  onClose: () => void;
};

/** Opens on hover or focus (and on click for touch); closes on leave, blur or Escape. */
function HoverMenu({
  trigger,
  children,
  label,
}: {
  trigger: ReactNode;
  children: ReactNode;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="vd-hover"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
    >
      <button
        type="button"
        className="vd-ctl"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
      >
        {trigger}
      </button>
      {open && <div className="vd-hover-pop">{children}</div>}
    </div>
  );
}

/** Accordion 1: the chart with the design's controls, the marks queue and the affected teeth. */
export function ChartSection(p: Props) {
  const m = useChartMarks({ patientId: p.patientId, visitId: p.visitId, onSaved: p.onSaved });
  const [view, setView] = useState<ChartView>(DEFAULT_CHART_VIEW);
  const [dentOverride, setDentOverride] = useState<DentitionView | null>(null);
  const [code, setCode] = useState("");
  const conditions = useMemo(() => chartConditionsFromList(p.conditions), [p.conditions]);
  const labels = useMemo(() => new Map(conditions.map((c) => [c.code, c.label])), [conditions]);
  const labelOf = (c: string) => labels.get(c) ?? c;

  useEffect(() => {
    loadChartView()
      .then((v) => v && setView(v))
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!conditions.some((c) => c.code === code)) setCode(conditions[0]?.code ?? "");
  }, [conditions, code]);

  const today = istDate(new Date());
  const age = ageYearsOn(
    { dateOfBirth: p.dateOfBirth, ageYearsAtReg: p.ageYearsAtReg, registeredOn: p.registeredOn },
    today,
  );
  const defaultDent = dentitionFromAgeYears(age);
  const dentition = dentOverride ?? defaultDent;
  const readOnly = !!m.asOf || !p.canEdit;
  const affected = affectedTeeth(m.cells, labelOf);
  const badge = chartBadge(affected);
  const { onBadge } = p;
  useEffect(() => onBadge(badge), [badge, onBadge]);
  const active = conditions.find((c) => c.code === code);

  return (
    <div className="vd-chart">
      <div className="vd-chart-bar">
        <div className="vd-chart-left">
          <label htmlFor="vd-as-of">Chart as of</label>
          <Select
            id="vd-as-of"
            className="vd-select"
            value={m.asOf}
            onChange={(e) => m.setAsOf(e.target.value)}
          >
            <option value="">Today (current)</option>
            {(m.chart?.history ?? []).map((h) => (
              <option key={h.id} value={h.id}>
                {h.visitDateLocal}
              </option>
            ))}
          </Select>
          {m.asOf && <span className="vd-pill vd-pill-warning">Read-only</span>}
        </div>
        <div className="vd-chart-right">
          <HoverMenu label="Dentition" trigger={<span>{DENTITION_LABEL[dentition]} ▾</span>}>
            <div role="group" aria-label="Dentition" className="vd-pop-list">
              {(Object.keys(DENTITION_LABEL) as DentitionView[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`vd-opt${k === dentition ? " is-active" : ""}`}
                  onClick={() => setDentOverride(k)}
                >
                  {DENTITION_LABEL[k]}
                  {k === defaultDent ? " (from age)" : ""}
                </button>
              ))}
            </div>
          </HoverMenu>
          <div className={`vd-edit-tools${readOnly ? " is-off" : ""}`} aria-hidden={readOnly}>
            <HoverMenu
              label="Apply condition"
              trigger={<span className="vd-mark-trigger">Mark: {active?.label ?? "—"} ▾</span>}
            >
              <div role="group" aria-label="Apply condition" className="vd-pop-grid">
                {conditions.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    className={`vd-opt${c.code === code ? " is-active" : ""}`}
                    onClick={() => setCode(c.code)}
                  >
                    <span style={{ color: c.color }} aria-hidden="true">
                      {c.icon}
                    </span>{" "}
                    {c.label}
                  </button>
                ))}
              </div>
            </HoverMenu>
            <button
              type="button"
              className="vd-ctl"
              disabled={readOnly || m.pending === 0}
              onClick={m.undo}
            >
              Undo
            </button>
            <button
              type="button"
              className="vd-ctl is-save"
              disabled={readOnly || m.pending === 0 || m.saving}
              onClick={() => void m.save()}
            >
              Save
            </button>
            <span
              className={`vd-save is-${m.state === "pending" ? "error" : "saved"}`}
              role="status"
              data-testid="chart-save-state"
            >
              {chartSaveText(m.state, m.savedAt)}
            </span>
          </div>
        </div>
      </div>

      {m.error && (
        <p className="vd-error" role="alert">
          {m.error}
        </p>
      )}

      {m.chart ? (
        <div className="vd-chart-grid">
          <ToothChart
            dentition={dentition}
            view={view}
            cells={m.cells}
            colorsByCode={conditionColorMap(conditions)}
            applyCondition={code}
            onApply={
              readOnly
                ? undefined
                : (tooth, surface, c) => {
                    const cond = conditions.find((x) => x.code === c);
                    if (cond && !conditionAllowsSurface(cond, surface)) return;
                    m.addMark({ toothFdi: tooth, surface, conditionCode: c });
                  }
            }
            onFocusChange={(tooth) => p.onSelect(tooth)}
            legend={conditions.map((c) => ({
              code: c.code,
              label: c.label,
              color: c.color,
              icon: c.icon,
            }))}
          />
        </div>
      ) : (
        <div className="vd-skel" style={{ width: 320 }} />
      )}

      {p.selected !== null && (
        <ToothCard
          patientId={p.patientId}
          visitId={p.visitId}
          tooth={p.selected}
          readOnly={!p.canEdit}
          conditionLabel={labelOf}
          refreshKey={p.refreshKey + m.savedKey}
          onClose={p.onClose}
          onSelectTooth={(t) => p.onSelect(t as FdiTooth)}
          onChartThen={m.setAsOf}
          pad={{
            buttons: padButtons(
              p.selected,
              m.cells,
              active,
              readOnly,
              (c) => conditions.find((x) => x.code === c)?.icon ?? c,
            ),
            colorOf: (c) => conditions.find((x) => x.code === c)?.color,
            onMark: (b) =>
              active &&
              p.selected !== null &&
              m.addMark({ toothFdi: p.selected, surface: b.surface, conditionCode: active.code }),
          }}
        />
      )}

      <div className="vd-affected">
        <span className="vd-tc-label">Affected teeth &amp; findings</span>
        {affected.length === 0 ? (
          <span className="vd-hint">No findings on the chart.</span>
        ) : (
          <div className="vd-affected-grid">
            {affected.map((t) => (
              <button
                key={t.fdi}
                type="button"
                className={`vd-tc-box${p.selected === t.fdi ? " is-sel" : ""}`}
                onClick={() => p.onSelect(t.fdi as FdiTooth)}
              >
                <strong>{t.fdi}</strong>
                <span>
                  {[...new Set(t.parts.map((x) => `${x.label} (${x.surface.toUpperCase()})`))].join(
                    ", ",
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
