import type { DoctorRow, RowKind } from "./doctor-model";

// What a list row shows: the colour of its status pill and the one main button.
export const PILL_CLASS: Record<RowKind, string> = {
  waiting: "td-pill-warning",
  not_arrived: "td-pill-neutral",
  stepped_out: "td-pill-neutral",
  late: "td-pill-error",
  done: "td-pill-success",
};

export type RowAction = { label: "Start" | "Back"; primary: boolean } | null;

/**
 * The main button of a row: Start (the first waiting patient is the filled one), Back for a patient
 * who stepped out, nothing for a done row. Late and Not arrived rows can also be started.
 */
export function rowAction(row: Pick<DoctorRow, "kind" | "isNext" | "canReorder">): RowAction {
  if (row.kind === "done" || !row.canReorder) return null;
  if (row.kind === "stepped_out") return { label: "Back", primary: false };
  return { label: "Start", primary: row.isNext };
}

/** A row that has a dot in front of its pill text (waiting and done). */
export const pillHasDot = (kind: RowKind) => kind === "waiting" || kind === "done";

/** The row's accessible name: "Anita Verma, 11:00 AM, waiting 12 min, next". */
export function rowLabel(row: DoctorRow): string {
  return [row.name, row.timeLabel, row.pill.toLowerCase(), row.isNext ? "next" : null]
    .filter(Boolean)
    .join(", ");
}
