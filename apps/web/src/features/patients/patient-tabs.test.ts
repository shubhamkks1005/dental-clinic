import { describe, expect, it } from "vitest";
import { PATIENT_PROFILE_TABS, readyPatientTabs } from "./patient-tabs";

describe("patient profile tabs (2.2.2)", () => {
  it("hides unfinished phase tabs", () => {
    const ready = readyPatientTabs().map((t) => t.id);
    expect(ready).toEqual(["overview", "appointments", "chart"]);
    expect(PATIENT_PROFILE_TABS.some((t) => t.id === "visits" && !t.ready)).toBe(true);
    expect(PATIENT_PROFILE_TABS.some((t) => t.id === "billing" && !t.ready)).toBe(true);
  });
});
