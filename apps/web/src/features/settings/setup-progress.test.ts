import { describe, expect, it } from "vitest";
import { setupSteps } from "./setup-progress";

describe("setupSteps", () => {
  it("marks the install placeholders as not done", () => {
    const steps = setupSteps({
      doctorName: "Dr Sample",
      registrationNo: "",
      clinicPhone: "0000000000",
      clinicAddress: "Sample address — set in Settings",
    });
    expect(steps.filter((s) => s.done)).toHaveLength(0);
  });
  it("marks real values as done", () => {
    const steps = setupSteps({
      doctorName: "Dr Fake Name",
      registrationNo: "REG-1",
      clinicPhone: "9876500000",
      clinicAddress: "1 Fake Road",
    });
    expect(steps.every((s) => s.done)).toBe(true);
  });
});
