import { describe, expect, it } from "vitest";
import { incompleteVisitsLabel } from "./incomplete-visits-label";

describe("incompleteVisitsLabel (3.5.8)", () => {
  it("uses singular and plural English", () => {
    expect(incompleteVisitsLabel(1)).toBe("1 visit not finalised");
    expect(incompleteVisitsLabel(3)).toBe("3 visits not finalised");
  });
});
