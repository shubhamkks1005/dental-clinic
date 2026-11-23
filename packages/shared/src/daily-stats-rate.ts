import { STAT_DIM_NONE } from "./daily-stats";

/** No-show % = noshow_count ÷ (noshow_arrived + noshow_count); walk-ins already excluded in both. */
export function noShowPercent(
  rows: { metric: string; dim: string; value: number }[],
): number | null {
  const noshow =
    rows.find((r) => r.metric === "noshow_count" && r.dim === STAT_DIM_NONE)?.value ?? 0;
  const arrived =
    rows.find((r) => r.metric === "noshow_arrived" && r.dim === STAT_DIM_NONE)?.value ?? 0;
  const denom = noshow + arrived;
  if (denom === 0) return null;
  return noshow / denom;
}
