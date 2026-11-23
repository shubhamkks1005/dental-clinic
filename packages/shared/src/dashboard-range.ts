import { addIstDays, istDate } from "./time";

/** Presets for GET /api/staff/dashboard?range=… (6.3.1 / 6.3.4). */
export const DASHBOARD_RANGE_PRESETS = [
  "today",
  "7d",
  "this_month",
  "last_month",
  "12m",
  "custom",
] as const;

export type DashboardRangePreset = (typeof DASHBOARD_RANGE_PRESETS)[number];

export type DashboardRangeQuery = {
  range?: string | null;
  from?: string | null;
  to?: string | null;
  compare?: string | null;
};

export type ResolvedDashboardRange = {
  preset: DashboardRangePreset;
  from: string;
  to: string;
  /** Day grain when span ≤ 62; month grain for longer (keeps rows-read under budget). */
  grain: "day" | "month";
  compareFrom?: string;
  compareTo?: string;
};

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
/** Cap custom range so one open cannot scan the whole table (6.5.3 will make this a setting). */
export const DASHBOARD_MAX_SPAN_DAYS = 366;
/** Prefer daily_stats below this; monthly_stats above (≈2 months). */
export const DASHBOARD_DAY_GRAIN_MAX = 62;

function daysInclusive(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000) + 1;
}

function monthOf(day: string): string {
  return day.slice(0, 7);
}

function startOfMonth(day: string): string {
  return `${monthOf(day)}-01`;
}

function endOfMonth(day: string): string {
  const [y, m] = monthOf(day).split("-").map(Number) as [number, number];
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${monthOf(day)}-${String(last).padStart(2, "0")}`;
}

function addMonthsYm(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function withCompare(
  from: string,
  to: string,
  want: boolean,
): Pick<ResolvedDashboardRange, "compareFrom" | "compareTo"> {
  if (!want) return {};
  const len = daysInclusive(from, to);
  const compareTo = addIstDays(from, -1);
  const compareFrom = addIstDays(compareTo, -(len - 1));
  return { compareFrom, compareTo };
}

function grainFor(from: string, to: string): "day" | "month" {
  return daysInclusive(from, to) > DASHBOARD_DAY_GRAIN_MAX ? "month" : "day";
}

/**
 * Resolve dashboard range query to IST dates. Default preset = this_month.
 * Invalid custom dates return a plain English message.
 */
export function parseDashboardRange(
  query: DashboardRangeQuery,
  now: Date = new Date(),
): { ok: true; range: ResolvedDashboardRange } | { ok: false; message: string } {
  const today = istDate(now);
  const wantCompare = query.compare === "1" || query.compare === "true";
  const raw = (query.range ?? "this_month").trim() || "this_month";
  if (!(DASHBOARD_RANGE_PRESETS as readonly string[]).includes(raw)) {
    return {
      ok: false,
      message: "Choose a range: today, 7d, this_month, last_month, 12m, or custom.",
    };
  }
  const preset = raw as DashboardRangePreset;

  let from: string;
  let to: string;

  if (preset === "today") {
    from = today;
    to = today;
  } else if (preset === "7d") {
    to = today;
    from = addIstDays(today, -6);
  } else if (preset === "this_month") {
    from = startOfMonth(today);
    to = today;
  } else if (preset === "last_month") {
    const prev = addMonthsYm(monthOf(today), -1);
    from = `${prev}-01`;
    to = endOfMonth(`${prev}-01`);
  } else if (preset === "12m") {
    const startYm = addMonthsYm(monthOf(today), -11);
    from = `${startYm}-01`;
    to = today;
  } else {
    const f = (query.from ?? "").trim();
    const t = (query.to ?? "").trim();
    if (!ISO_DAY.test(f) || !ISO_DAY.test(t)) {
      return { ok: false, message: "Custom range needs from and to as YYYY-MM-DD." };
    }
    if (f > t) {
      return { ok: false, message: "Custom range from must be on or before to." };
    }
    if (daysInclusive(f, t) > DASHBOARD_MAX_SPAN_DAYS) {
      return {
        ok: false,
        message: `Custom range can be at most ${DASHBOARD_MAX_SPAN_DAYS} days.`,
      };
    }
    from = f;
    to = t;
  }

  return {
    ok: true,
    range: {
      preset,
      from,
      to,
      grain: grainFor(from, to),
      ...withCompare(from, to, wantCompare),
    },
  };
}
