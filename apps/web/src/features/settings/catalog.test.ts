import { describe, expect, it } from "vitest";
import {
  filterSettingsSections,
  SETTINGS_SECTIONS,
  settingsReachableInThreeClicks,
} from "./catalog";

describe("settings catalog (6.5.1)", () => {
  it("search finds timings, medicines, and staff by keyword", () => {
    expect(filterSettingsSections(SETTINGS_SECTIONS, "holiday").map((s) => s.path)).toContain(
      "timings",
    );
    expect(filterSettingsSections(SETTINGS_SECTIONS, "medicine").map((s) => s.path)).toContain(
      "medicines",
    );
    expect(filterSettingsSections(SETTINGS_SECTIONS, "gmail").map((s) => s.path)).toContain(
      "staff",
    );
  });

  it("every catalog path is within three clicks of the hub", () => {
    for (const s of SETTINGS_SECTIONS) {
      expect(settingsReachableInThreeClicks(s.path)).toBe(true);
    }
  });

  it("empty query returns all sections", () => {
    expect(filterSettingsSections(SETTINGS_SECTIONS, "  ")).toHaveLength(SETTINGS_SECTIONS.length);
  });
});
