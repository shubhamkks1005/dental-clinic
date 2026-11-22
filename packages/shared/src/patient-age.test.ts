import { describe, expect, it } from "vitest";
import {
  ageYearsFromDob,
  ageYearsOn,
  displayAge,
  formatAgeYears,
  fullYearsBetween,
  isMinor,
} from "./patient-age";

describe("patient age (2.1.3 / 2.1.4)", () => {
  it("counts full years from DOB", () => {
    expect(ageYearsFromDob("2016-11-22", "2026-11-22")).toBe(10);
    expect(ageYearsFromDob("2016-11-23", "2026-11-22")).toBe(9);
  });

  it("a five-year-old registration still shows the correct age today (2.1.4)", () => {
    // Recorded as age 5 on 2021-11-22 → must show 10 yrs on 2026-11-22, not "5 yrs".
    const source = { dateOfBirth: null, ageYearsAtReg: 5, registeredOn: "2021-11-22" };
    expect(ageYearsOn(source, "2026-11-22")).toBe(10);
    expect(displayAge(source, "2026-11-22")).toBe("10 yrs");
  });

  it("prefers DOB over age-at-reg", () => {
    expect(
      ageYearsOn(
        { dateOfBirth: "2000-01-01", ageYearsAtReg: 99, registeredOn: "2020-01-01" },
        "2026-11-22",
      ),
    ).toBe(ageYearsFromDob("2000-01-01", "2026-11-22"));
  });

  it("marks under 18 as minor", () => {
    expect(
      isMinor({ dateOfBirth: null, ageYearsAtReg: 17, registeredOn: "2026-11-22" }, "2026-11-22"),
    ).toBe(true);
    expect(
      isMinor({ dateOfBirth: null, ageYearsAtReg: 18, registeredOn: "2026-11-22" }, "2026-11-22"),
    ).toBe(false);
  });

  it("formats age for screens", () => {
    expect(formatAgeYears(34)).toBe("34 yrs");
    expect(formatAgeYears(null)).toBe("");
    expect(fullYearsBetween("2026-11-22", "2026-11-22")).toBe(0);
  });
});
