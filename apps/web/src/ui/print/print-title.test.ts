import { describe, expect, it } from "vitest";
import { printTitle } from "./print-title";

describe("print file name (1.4.8)", () => {
  it("names the saved PDF after the document, patient number and date (no slashes)", () => {
    expect(printTitle("Prescription", "P-000412", "2026-11-22")).toBe(
      "Prescription P-000412 22-11-2026",
    );
  });
});
