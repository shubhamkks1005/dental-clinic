import { describe, expect, it } from "vitest";
import { parseSettingValue } from "./settings";

describe("medicines list review setting (4.5.4)", () => {
  it("accepts a review record with itemCount as list version", () => {
    const parsed = parseSettingValue("medicines.list_reviewed", {
      at: "2026-11-23T10:00:00.000Z",
      byUserId: "doc-a",
      byName: "Dr Sample",
      itemCount: 45,
      note: "",
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value).toMatchObject({ itemCount: 45, byName: "Dr Sample" });
    }
  });

  it("allows null (not reviewed yet)", () => {
    expect(parseSettingValue("medicines.list_reviewed", null)).toEqual({ ok: true, value: null });
  });
});
