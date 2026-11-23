import { describe, expect, it } from "vitest";
import { BLANK_FORM_COPY_COUNT, parseBlankFormKind } from "./blank-forms";

describe("blank forms (4.4.6)", () => {
  it("defaults to 20 copies", () => {
    expect(BLANK_FORM_COPY_COUNT).toBe(20);
  });

  it("parses known kinds only", () => {
    expect(parseBlankFormKind("registration")).toBe("registration");
    expect(parseBlankFormKind("nope")).toBeNull();
  });
});
