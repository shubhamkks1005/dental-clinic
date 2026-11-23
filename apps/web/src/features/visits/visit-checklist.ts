import type { VisitSummary } from "./api";

export type ChecklistItem = { key: string; label: string; state: "ok" | "warn" | "neutral" };

/** The three things the doctor checks before Finalise. Same facts as finalise-warnings.ts. */
export function visitChecklist(
  visit: Pick<VisitSummary, "diagnoses" | "procedures">,
  rx: "none" | "draft" | "issued",
): ChecklistItem[] {
  const procs = visit.procedures.length;
  return [
    {
      key: "dx",
      label: visit.diagnoses.length > 0 ? "Diagnosis" : "No diagnosis",
      state: visit.diagnoses.length > 0 ? "ok" : "warn",
    },
    {
      key: "proc",
      label: procs > 0 ? `Procedures (${procs})` : "No procedures",
      state: procs > 0 ? "ok" : "warn",
    },
    {
      key: "rx",
      label:
        rx === "issued"
          ? "Prescription issued"
          : rx === "draft"
            ? "Prescription not issued"
            : "No prescription",
      state: rx === "issued" ? "ok" : rx === "draft" ? "warn" : "neutral",
    },
  ];
}
