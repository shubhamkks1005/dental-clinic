import { describe, expect, it } from "vitest";
import type { VisitSummary } from "./api";
import { finaliseWarnings } from "./finalise-warnings";

const base: VisitSummary = {
  id: "v1",
  patientId: "p1",
  appointmentId: null,
  doctorId: "d1",
  visitDateLocal: "2026-11-23",
  status: "draft",
  chiefComplaint: null,
  historyNote: null,
  examNote: null,
  gumCondition: null,
  bpSystolic: null,
  bpDiastolic: null,
  pulse: null,
  advice: null,
  nextVisitNote: null,
  finalisedAt: null,
  finalisedBy: null,
  snapshotHash: null,
  version: 1,
  diagnoses: [],
  procedures: [],
  addenda: [],
};

describe("finaliseWarnings (3.5.6)", () => {
  it("warns when diagnosis is missing", () => {
    expect(finaliseWarnings(base)).toContain("No diagnosis is recorded yet.");
  });

  it("warns when procedures exist without plan check", () => {
    const w = finaliseWarnings({
      ...base,
      diagnoses: [
        {
          id: "dx1",
          visitId: "v1",
          listItemId: null,
          label: "Caries",
          toothFdi: 46,
          sortOrder: 1,
        },
      ],
      procedures: [
        {
          id: "pr1",
          visitId: "v1",
          listItemId: "l1",
          label: "Filling",
          toothFdi: 46,
          surfaces: ["o"],
          note: null,
          defaultPaise: 100,
          sortOrder: 1,
        },
      ],
    });
    expect(w.some((s) => s.includes("treatment plan"))).toBe(true);
    expect(w.some((s) => s.includes("diagnosis"))).toBe(false);
  });

  it("soft-warns extraction without treatment consent (3.8.2)", () => {
    const w = finaliseWarnings(
      {
        ...base,
        diagnoses: [
          {
            id: "dx1",
            visitId: "v1",
            listItemId: null,
            label: "Hopeless",
            toothFdi: 46,
            sortOrder: 1,
          },
        ],
        procedures: [
          {
            id: "pr1",
            visitId: "v1",
            listItemId: "l1",
            label: "Extraction 46",
            toothFdi: 46,
            surfaces: ["whole"],
            note: null,
            defaultPaise: 100,
            sortOrder: 1,
          },
        ],
      },
      { hasTreatmentConsent: false },
    );
    expect(w.some((s) => s.toLowerCase().includes("consent"))).toBe(true);
  });

  it("Q1.1: warns when there are no procedures (the bill would be empty)", () => {
    const w = finaliseWarnings(base);
    expect(w.some((x) => x.startsWith("No procedures are recorded"))).toBe(true);
  });

  it("Q1.1: warns when the prescription is still a draft", () => {
    const w = finaliseWarnings(base, { hasDraftPrescription: true });
    expect(w.some((x) => x.includes("prescription is still a draft"))).toBe(true);
    expect(finaliseWarnings(base, { hasDraftPrescription: false })).not.toContain(
      "The prescription is still a draft. Issue it from the Medicines tab first.",
    );
  });
});
