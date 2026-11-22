import { describe, expect, it } from "vitest";
import { dentitionFromAgeYears } from "./dentition";

describe("dentition from age (3.4.6)", () => {
  it("uses primary under 6, mixed 6–12, permanent from 13", () => {
    expect(dentitionFromAgeYears(5)).toBe("primary");
    expect(dentitionFromAgeYears(6)).toBe("mixed");
    expect(dentitionFromAgeYears(8)).toBe("mixed");
    expect(dentitionFromAgeYears(12)).toBe("mixed");
    expect(dentitionFromAgeYears(13)).toBe("permanent");
    expect(dentitionFromAgeYears(null)).toBe("permanent");
  });
});
