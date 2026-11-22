import { chartFromEvents, type ChartCell, type ToothEventLike } from "@clinic/shared";
import { useState } from "react";
import { ToothChart } from "./ToothChart";

/** Local-only harness so 3.4.2 Done-when (keyboard filling) can be checked without a visit. */
export function ChartPlayground() {
  const [events, setEvents] = useState<ToothEventLike[]>([]);
  const cells: ChartCell[] = chartFromEvents(events);

  return (
    <ToothChart
      cells={cells}
      applyCondition="filling"
      onApply={(tooth, surface, conditionCode) => {
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
      legend={[{ code: "filling", label: "Filling", color: "#1E4FA3" }]}
    />
  );
}
