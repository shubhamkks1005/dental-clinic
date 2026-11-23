import type { ResolvedDashboardRange } from "./dashboard-range";
import { STAT_DIM_NONE } from "./daily-stats";

/** One undimensioned day (or month bucket) for charts. */
export type DashboardSeriesPoint = {
  key: string;
  arrived: number;
  newPatients: number;
  returning: number;
  billedPaise: number;
  collectedPaise: number;
  noshow: number;
  cancelled: number;
};

export type DashboardDimTotal = { dim: string; value: number };

export type DashboardTotals = {
  arrived: number;
  newPatients: number;
  returning: number;
  billedPaise: number;
  collectedPaise: number;
  noshow: number;
  cancelled: number;
};

/** Fixed top-4 KPIs (DRAFT until 6.1.1 sister pick). */
export type DashboardKpis = {
  todayArrived: number;
  prevTodayArrived: number;
  monthNew: number;
  prevMonthNew: number;
  monthCollectedPaise: number;
  prevMonthCollectedPaise: number;
  outstandingPaise: number;
};

/** Prepared payload for the doctor dashboard (no patient names). */
export type DashboardPayload = {
  range: ResolvedDashboardRange;
  series: DashboardSeriesPoint[];
  totals: DashboardTotals;
  compareTotals: DashboardTotals | null;
  apptStatus: DashboardDimTotal[];
  procedures: DashboardDimTotal[];
  referrals: DashboardDimTotal[];
  collectedByMode: DashboardDimTotal[];
  kpis: DashboardKpis;
  /** 6.3.6: weekday × hour arrived counts for the selected range. */
  busyHeat: { row: string; col: string; value: number }[];
  /** Rows returned from stats tables (+ live today aggregates counted as 1 each). */
  rowsRead: number;
  /** 9.1.10: backup / ops lines for Things to watch (no PHI). */
  attention?: {
    backup: { tone: "ok" | "warn" | "bad"; text: string };
    /** 8.2.11: open patient requests and how many are past their due date. */
    requests?: { open: number; overdue: number };
  };
};

export type StatCell = { period: string; metric: string; dim: string; value: number };

export function emptyTotals(): DashboardTotals {
  return {
    arrived: 0,
    newPatients: 0,
    returning: 0,
    billedPaise: 0,
    collectedPaise: 0,
    noshow: 0,
    cancelled: 0,
  };
}

/** Fold flat daily_stats / monthly_stats cells into series + dim totals. */
export function buildDashboardFromCells(
  range: ResolvedDashboardRange,
  cells: StatCell[],
  compareCells: StatCell[],
  rowsRead: number,
  kpis: DashboardKpis,
  busyHeat: { row: string; col: string; value: number }[] = [],
): DashboardPayload {
  const { series, totals, apptStatus, procedures, referrals, collectedByMode } = foldCells(cells);
  const compareTotals =
    range.compareFrom && range.compareTo ? foldCells(compareCells).totals : null;
  return {
    range,
    series,
    totals,
    compareTotals,
    apptStatus: topN(apptStatus, 20),
    procedures: topN(procedures, 8),
    referrals: topN(referrals, 6),
    collectedByMode: topN(collectedByMode, 10),
    kpis,
    busyHeat,
    rowsRead,
  };
}

function foldCells(cells: StatCell[]) {
  const byKey = new Map<string, DashboardSeriesPoint>();
  const totals = emptyTotals();
  const appt = new Map<string, number>();
  const proc = new Map<string, number>();
  const ref = new Map<string, number>();
  const modes = new Map<string, number>();

  const point = (key: string): DashboardSeriesPoint => {
    let p = byKey.get(key);
    if (!p) {
      p = {
        key,
        arrived: 0,
        newPatients: 0,
        returning: 0,
        billedPaise: 0,
        collectedPaise: 0,
        noshow: 0,
        cancelled: 0,
      };
      byKey.set(key, p);
    }
    return p;
  };

  for (const c of cells) {
    const p = point(c.period);
    if (c.metric === "arrived_patients" && c.dim === STAT_DIM_NONE) {
      p.arrived += c.value;
      totals.arrived += c.value;
    } else if (c.metric === "new_patients" && c.dim === STAT_DIM_NONE) {
      p.newPatients += c.value;
      totals.newPatients += c.value;
    } else if (c.metric === "returning_patients" && c.dim === STAT_DIM_NONE) {
      p.returning += c.value;
      totals.returning += c.value;
    } else if (c.metric === "billed_paise" && c.dim === STAT_DIM_NONE) {
      p.billedPaise += c.value;
      totals.billedPaise += c.value;
    } else if (c.metric === "collected_paise" && c.dim === STAT_DIM_NONE) {
      p.collectedPaise += c.value;
      totals.collectedPaise += c.value;
    } else if (c.metric === "collected_paise" && c.dim !== STAT_DIM_NONE) {
      modes.set(c.dim, (modes.get(c.dim) ?? 0) + c.value);
    } else if (c.metric === "noshow_count" && c.dim === STAT_DIM_NONE) {
      p.noshow += c.value;
      totals.noshow += c.value;
    } else if (c.metric === "appt_status" && c.dim === "cancelled") {
      p.cancelled += c.value;
      totals.cancelled += c.value;
      appt.set(c.dim, (appt.get(c.dim) ?? 0) + c.value);
    } else if (c.metric === "appt_status") {
      appt.set(c.dim, (appt.get(c.dim) ?? 0) + c.value);
    } else if (c.metric === "procedure_count") {
      proc.set(c.dim, (proc.get(c.dim) ?? 0) + c.value);
    } else if (c.metric === "referral_count") {
      ref.set(c.dim, (ref.get(c.dim) ?? 0) + c.value);
    }
  }

  const series = [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key));
  return {
    series,
    totals,
    apptStatus: mapToDims(appt),
    procedures: mapToDims(proc),
    referrals: mapToDims(ref),
    collectedByMode: mapToDims(modes),
  };
}

function mapToDims(m: Map<string, number>): DashboardDimTotal[] {
  return [...m.entries()].map(([dim, value]) => ({ dim, value }));
}

function topN(rows: DashboardDimTotal[], n: number): DashboardDimTotal[] {
  return [...rows].sort((a, b) => b.value - a.value).slice(0, n);
}
