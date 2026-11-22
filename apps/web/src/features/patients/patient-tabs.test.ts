import { describe, expect, it } from "vitest";
import { PATIENT_PROFILE_TABS, readyPatientTabs } from "./patient-tabs";

describe("patient profile tabs (2.2.2 / 3.5.9)", () => {
  it("hides unfinished phase tabs; visits timeline is ready", () => {
    const ready = readyPatientTabs().map((t) => t.id);
    expect(ready).toEqual(["overview", "history", "appointments", "chart", "visits", "files"]);
    expect(PATIENT_PROFILE_TABS.some((t) => t.id === "billing" && !t.ready)).toBe(true);
  });
});
