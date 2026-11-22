import { procedureNeedsConsentWarning } from "@clinic/shared";
import type { VisitSummary } from "./api";

/** Soft warnings before finalise (3.5.6 / 3.8.2). Never block — doctor may continue. */
export function finaliseWarnings(
  visit: VisitSummary,
  opts?: { hasTreatmentConsent?: boolean },
): string[] {
  const out: string[] = [];
  if (visit.diagnoses.length === 0) {
    out.push("No diagnosis is recorded yet.");
  }
  if (visit.procedures.length > 0) {
    out.push("Procedures were added. Check the treatment plan is up to date.");
  }
  const needsConsent = visit.procedures.some((p) => procedureNeedsConsentWarning(p.label));
  if (needsConsent && opts?.hasTreatmentConsent === false) {
    out.push(
      "Extraction (or similar) has no treatment consent on file. Record consent or attach a signed scan before finishing if you can.",
    );
  }
  return out;
}
