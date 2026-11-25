import { formatRupees } from "@clinic/shared";
import type { VisitPageData } from "./page-api";

// Words of the always-visible strip under the patient name (design: header strip).

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** 2026-11-18 gives "18 Nov". */
export function shortDay(on: string): string {
  const [, m, d] = on.split("-").map(Number) as [number, number, number];
  return `${d} ${MONTHS[m - 1] ?? ""}`;
}

/**
 * "Follow-up: 4 days late (18 Nov due · meds finished)". The words say what it is; colour only helps.
 * `today` is the clinic day (IST) so the text never depends on the device clock.
 */
export function followUpText(f: VisitPageData["followUp"], today: string): string | null {
  if (!f) return null;
  const due = shortDay(f.dueOn);
  if (f.state === "due_today") return "Follow-up: due today";
  if (f.state === "upcoming") return `Follow-up: due ${due}`;
  const days = `${f.daysLate} ${f.daysLate === 1 ? "day" : "days"} late`;
  const finished = f.medsFinishedOn !== null && f.medsFinishedOn <= today;
  return `Follow-up: ${days} (${due} due${finished ? " · meds finished" : ""})`;
}

export const duesText = (paise: number): string | null =>
  paise > 0 ? `Dues: ${formatRupees(paise)} due` : null;

/** "BP: 128/82" when both numbers are saved on the visit. */
export function bpText(v: {
  bpSystolic: number | null;
  bpDiastolic: number | null;
}): string | null {
  return v.bpSystolic !== null && v.bpDiastolic !== null
    ? `BP: ${v.bpSystolic}/${v.bpDiastolic}`
    : null;
}
