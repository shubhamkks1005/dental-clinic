import {
  chartConditionsFromList,
  chartFromEvents,
  conditionAllowsSurface,
  conditionColorMap,
  type ChartCell,
  type ChartCondition,
  type ToothEventLike,
} from "@clinic/shared";
import { useEffect, useState } from "react";
import { getList } from "../lists";
import { ToothChart } from "./ToothChart";

/** Local-only harness so chart Done-when checks work without a visit (3.4.2–3.4.4). */
export function ChartPlayground() {
  const [events, setEvents] = useState<ToothEventLike[]>([]);
  const [conditions, setConditions] = useState<ChartCondition[]>([]);
  const [applyCode, setApplyCode] = useState("filling");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getList("conditions")
      .then((items) => {
        if (cancelled) return;
        const list = chartConditionsFromList(items);
        setConditions(list);
        if (list[0]) setApplyCode(list.find((c) => c.code === "filling")?.code ?? list[0].code);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load tooth conditions. Try again.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cells: ChartCell[] = chartFromEvents(events);
  const colorsByCode = conditionColorMap(conditions);
  const active = conditions.find((c) => c.code === applyCode) ?? conditions[0];

  return (
    <div className="chart-playground">
      {error && <p className="form-error">{error}</p>}
      {conditions.length > 0 && (
        <label className="chart-playground-pick">
          Apply condition
          <select value={active?.code ?? applyCode} onChange={(e) => setApplyCode(e.target.value)}>
            {conditions.map((c) => (
              <option key={c.code} value={c.code}>
                {c.icon} · {c.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <ToothChart
        cells={cells}
        colorsByCode={colorsByCode}
        applyCondition={active?.code ?? applyCode}
        onApply={(tooth, surface, conditionCode) => {
          const cond = conditions.find((c) => c.code === conditionCode);
          if (cond && !conditionAllowsSurface(cond, surface)) return;
          setEvents((prev) => [
            ...prev,
            {
              id: `local-${prev.length + 1}`,
              toothFdi: tooth,
              surface,
              conditionCode,
              notedAt: new Date().toISOString(),
            },
          ]);
        }}
        legend={conditions.map((c) => ({
          code: c.code,
          label: c.label,
          color: c.color,
          icon: c.icon,
        }))}
      />
    </div>
  );
}
