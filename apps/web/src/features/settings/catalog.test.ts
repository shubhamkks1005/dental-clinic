import { describe, expect, it } from "vitest";
import {
  filterLibraryHits,
  filterSettingsSections,
  SETTINGS_GROUPS,
  SETTINGS_REDIRECTS,
  SETTINGS_SECTIONS,
  settingsReachableInThreeClicks,
} from "./catalog";

describe("settings catalog (Q2.13)", () => {
  it("has 8 items in 4 groups", () => {
    expect(SETTINGS_SECTIONS).toHaveLength(8);
    expect(SETTINGS_GROUPS).toHaveLength(4);
    for (const s of SETTINGS_SECTIONS) {
      expect(SETTINGS_GROUPS.map((g) => g.id)).toContain(s.group);
    }
  });

  it("search finds timings and staff here, and medicines in the Library", () => {
    expect(filterSettingsSections(SETTINGS_SECTIONS, "holiday").map((s) => s.path)).toContain(
      "timings",
    );
    expect(filterSettingsSections(SETTINGS_SECTIONS, "gmail").map((s) => s.path)).toContain(
      "staff",
    );
    expect(filterLibraryHits("medicine").map((h) => h.to)).toContain("/app/library/medicines");
  });

  it("old list and form paths redirect", () => {
    expect(SETTINGS_REDIRECTS["medicines"]).toBe("/app/library/medicines");
    expect(SETTINGS_REDIRECTS["visit_types"]).toBe("/app/library/visit_types");
    expect(SETTINGS_REDIRECTS["privacy-notice"]).toBe("/app/settings/consent");
    expect(SETTINGS_REDIRECTS["numbers"]).toBe("/app/settings/advanced");
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
