import { describe, expect, it } from "vitest";
import { openVisitBody, VISIT_STATUSES, VISIT_STATUS_LABEL } from "./visits";

describe("visits (3.2.1)", () => {
  it("lists draft, final, void", () => {
    expect([...VISIT_STATUSES]).toEqual(["draft", "final", "void"]);
    expect(VISIT_STATUS_LABEL.final).toBe("Finalised");
  });

  it("accepts open body with optional appointment", () => {
    expect(
      openVisitBody.parse({
        patientId: "p1",
        visitDateLocal: "2026-11-22",
      }),
    ).toEqual({ patientId: "p1", visitDateLocal: "2026-11-22" });
    expect(
      openVisitBody.parse({
        patientId: "p1",
        appointmentId: "a1",
        visitDateLocal: "2026-11-22",
      }).appointmentId,
    ).toBe("a1");
  });

  it("rejects a bad date", () => {
    expect(() => openVisitBody.parse({ patientId: "p1", visitDateLocal: "22/11/2026" })).toThrow();
  });
});
