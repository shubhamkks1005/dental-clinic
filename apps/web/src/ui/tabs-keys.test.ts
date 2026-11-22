import { describe, expect, it } from "vitest";
import { nextTabIndex } from "./tabs-keys";

describe("tab keyboard rules (1.4.2)", () => {
  it("arrows move and wrap around", () => {
    expect(nextTabIndex(0, "ArrowRight", 3)).toBe(1);
    expect(nextTabIndex(2, "ArrowRight", 3)).toBe(0);
    expect(nextTabIndex(0, "ArrowLeft", 3)).toBe(2);
  });

  it("Home and End jump to the ends; other keys do nothing", () => {
    expect(nextTabIndex(1, "Home", 3)).toBe(0);
    expect(nextTabIndex(1, "End", 3)).toBe(2);
    expect(nextTabIndex(1, "Enter", 3)).toBeNull();
    expect(nextTabIndex(0, "ArrowRight", 0)).toBeNull();
  });
});
