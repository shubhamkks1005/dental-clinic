import type { VisitSummary } from "./api";

/** Soft warnings before finalise (3.5.6). Never block — doctor may continue. */
export function finaliseWarnings(visit: VisitSummary): string[] {
  const out: string[] = [];
  if (visit.diagnoses.length === 0) {
    out.push("No diagnosis is recorded yet.");
  }
  if (visit.procedures.length > 0) {
    out.push(
      "Procedures were added. Check the treatment plan is up to date (plan link comes in 3.6).",
    );
  }
  return out;
}
