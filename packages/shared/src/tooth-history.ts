// B10: the history of one tooth (doctor visit page, tooth card). Rows come from several tables;
// this file only merges them: newest first, neighbouring chart marks of one visit grouped, and
// exact paging by cursor.

export const TOOTH_HISTORY_PAGE = 20;

export type ToothHistoryKind = "chart" | "procedure" | "diagnosis" | "file";

/** One row as a table gives it. `at` is an ISO time, `id` breaks ties. */
export type ToothHistoryRow = {
  id: string;
  at: string;
  kind: ToothHistoryKind;
  /** The tooth the row is about (the baby tooth number for rows of a linked baby tooth). */
  toothFdi: number;
  /** Chart: condition code (the screen turns it into the list label). Others: the saved label. */
  title: string;
  /** Chart mark: its one surface. Procedure: the surfaces worked on. Empty for the rest. */
  surfaces: string[];
  note: string | null;
  visitId: string | null;
  /** On today's draft visit (or marked today without a visit): shown as "today". */
  isToday: boolean;
  fileId: string | null;
};

export type ToothHistoryEntry = {
  id: string;
  at: string;
  kind: ToothHistoryKind;
  toothFdi: number;
  title: string;
  note: string | null;
  visitId: string | null;
  isToday: boolean;
  fileId: string | null;
  /** Surfaces of grouped chart marks (m, d, o, b, l, whole), oldest mark first. */
  surfaces: string[];
  /** Set when the entry is from the baby tooth that this permanent tooth replaced. */
  fromTooth: number | null;
};

export type ToothHistorySource = {
  rows: ToothHistoryRow[];
  /** True when the table had more rows than it returned (the query asked for PAGE + 1). */
  truncated: boolean;
};

export type ToothHistoryPage = { entries: ToothHistoryEntry[]; next: string | null };

type Keyed = { id: string; at: string };

/** Newest first: later time wins, then the larger id. Negative means `a` is newer. */
export function newerFirst(a: Keyed, b: Keyed): number {
  if (a.at !== b.at) return a.at < b.at ? 1 : -1;
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

export const cursorOf = (k: Keyed) => `${k.at}|${k.id}`;

export function parseHistoryCursor(raw: string | null | undefined): Keyed | null {
  if (!raw) return null;
  const m = /^(\d{4}-\d{2}-\d{2}T[0-9:.]+Z)\|([0-9A-Za-z_-]{1,40})$/.exec(raw);
  return m ? { at: m[1] as string, id: m[2] as string } : null;
}

const sameRun = (a: ToothHistoryRow, b: ToothHistoryRow) =>
  a.kind === "chart" &&
  b.kind === "chart" &&
  a.toothFdi === b.toothFdi &&
  a.title === b.title &&
  a.visitId === b.visitId &&
  (a.visitId !== null || a.at.slice(0, 10) === b.at.slice(0, 10));

/**
 * Merge the sources into one page. A source that was cut short (`truncated`) only vouches for rows
 * newer than its last row, so rows at or below the newest such bound wait for the next page. Chart
 * marks that follow each other (same tooth, condition and visit) become one entry; a run that
 * touches that bound can be split across two pages. `baby` is the linked baby tooth, if any.
 */
export function mergeToothHistory(
  sources: ToothHistorySource[],
  baby: number | null,
  pageSize = TOOTH_HISTORY_PAGE,
): ToothHistoryPage {
  let floor: Keyed | null = null;
  for (const s of sources) {
    if (!s.truncated || s.rows.length === 0) continue;
    const last = [...s.rows].sort(newerFirst).at(-1) as ToothHistoryRow;
    if (!floor || newerFirst(last, floor) < 0) floor = last;
  }

  const rows = sources
    .flatMap((s) => s.rows)
    .filter((r) => !floor || newerFirst(r, floor) < 0)
    .sort(newerFirst);

  const runs: ToothHistoryRow[][] = [];
  for (const r of rows) {
    const run = runs[runs.length - 1];
    if (run && sameRun(run[run.length - 1] as ToothHistoryRow, r)) run.push(r);
    else runs.push([r]);
  }

  const page = runs.slice(0, pageSize);
  const entries = page.map((run): ToothHistoryEntry => {
    const first = run[0] as ToothHistoryRow;
    return {
      id: first.id,
      at: first.at,
      kind: first.kind,
      toothFdi: first.toothFdi,
      title: first.title,
      note: first.note,
      visitId: first.visitId,
      isToday: run.some((r) => r.isToday),
      fileId: first.fileId,
      surfaces: [...new Set([...run].reverse().flatMap((r) => r.surfaces))],
      fromTooth: baby !== null && first.toothFdi === baby ? baby : null,
    };
  });

  const lastRun = page[page.length - 1];
  const more = runs.length > pageSize || floor !== null;
  return {
    entries,
    next: more && lastRun ? cursorOf(lastRun[lastRun.length - 1] as ToothHistoryRow) : null,
  };
}
