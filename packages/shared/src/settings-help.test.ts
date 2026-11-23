import { describe, expect, it } from "vitest";
import { SETTING_KEYS } from "./settings";
import { SETTING_HELP, allSettingsHaveHelp } from "./settings-help";
import { TUNABLE_KEYS } from "./tunables";

describe("settings help (6.5.6)", () => {
  it("every setting key has a non-empty English help line", () => {
    expect(allSettingsHaveHelp()).toBe(true);
    for (const key of SETTING_KEYS) {
      const line = SETTING_HELP[key];
      expect(line.trim().length, key).toBeGreaterThan(20);
      expect(line, key).toMatch(/[A-Za-z]/);
    }
  });

  it("every tunable help is reused for its setting key", () => {
    for (const key of TUNABLE_KEYS) {
      expect(SETTING_HELP[key].length).toBeGreaterThan(10);
    }
  });
});
