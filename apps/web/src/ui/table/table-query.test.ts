import { firstPage } from "@clinic/shared";
import { describe, expect, it } from "vitest";
import { ariaSort, rangeText, toggleSort } from "./table-query";

describe("data table helpers (1.4.5)", () => {
  it("a new column sorts A-Z from page 1; the same column flips", () => {
    const start = { ...firstPage("name"), page: 4 };
    const byCode = toggleSort(start, "code");
    expect(byCode).toMatchObject({ sort: "code", dir: "asc", page: 1 });
    expect(toggleSort(byCode, "code")).toMatchObject({ sort: "code", dir: "desc" });
    expect(toggleSort(toggleSort(byCode, "code"), "code")).toMatchObject({ dir: "asc" });
  });

  it("tells screen readers how each column is sorted", () => {
    const q = { ...firstPage("name"), dir: "desc" as const };
    expect(ariaSort(q, "name")).toBe("descending");
    expect(ariaSort(q, "code")).toBe("none");
  });

  it("shows the visible range with Indian digit grouping", () => {
    expect(rangeText(2, 25, 5000)).toBe("Showing 26–50 of 5,000");
    expect(rangeText(200, 25, 5000)).toBe("Showing 4,976–5,000 of 5,000");
    expect(rangeText(1, 25, 7)).toBe("Showing 1–7 of 7");
    expect(rangeText(1, 25, 0)).toBe("No results");
    expect(rangeText(1, 25, 150000)).toBe("Showing 1–25 of 1,50,000");
  });
});
