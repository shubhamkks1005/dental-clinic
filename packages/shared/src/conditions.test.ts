import { describe, expect, it } from "vitest";
import {
  chartConditionFromItem,
  chartConditionsFromList,
  conditionAllowsSurface,
  conditionColorMap,
} from "./conditions";
import { listItemSchema } from "./lists";

describe("tooth conditions (3.4.4)", () => {
  it("list schema needs code, colour, icon and applies_to", () => {
    const parsed = listItemSchema("conditions").parse({
      label: "Crown",
      data: { code: "crown", color: "#7c3aed", icon: "Cr", applies_to: "whole" },
    });
    expect(parsed.data.color).toBe("#7C3AED");
    expect(chartConditionFromItem(parsed)).toEqual({
      code: "crown",
      label: "Crown",
      color: "#7C3AED",
      icon: "Cr",
      appliesTo: "whole",
    });
  });

  it("builds legend colours and respects applies_to", () => {
    const list = chartConditionsFromList([
      {
        id: "1",
        label: "Filling",
        data: { code: "filling", color: "#1E4FA3", icon: "F", applies_to: "surface" },
        active: true,
        sortOrder: 1,
        version: 1,
      },
      {
        id: "2",
        label: "Missing",
        data: { code: "missing", color: "#64748B", icon: "M", applies_to: "whole" },
        active: true,
        sortOrder: 2,
        version: 1,
      },
      {
        id: "3",
        label: "Hidden",
        data: { code: "x", color: "#000000", icon: "X", applies_to: "both" },
        active: false,
        sortOrder: 3,
        version: 1,
      },
    ]);
    expect(list).toHaveLength(2);
    expect(conditionColorMap(list).get("filling")).toBe("#1E4FA3");
    expect(conditionAllowsSurface(list[0]!, "o")).toBe(true);
    expect(conditionAllowsSurface(list[0]!, "whole")).toBe(false);
    expect(conditionAllowsSurface(list[1]!, "whole")).toBe(true);
    expect(conditionAllowsSurface(list[1]!, "o")).toBe(false);
  });
});
