import { describe, expect, it } from "vitest";
import { isVisitTabId, VISIT_TAB_IDS, VISIT_TAB_LABEL } from "./visit-tabs";

describe("visit tabs (3.5.2)", () => {
  it("has the five S05 tabs in order", () => {
    expect([...VISIT_TAB_IDS]).toEqual(["today", "chart", "plan", "history", "files"]);
    expect(VISIT_TAB_LABEL.today).toBe("Today's visit");
    expect(isVisitTabId("chart")).toBe(true);
    expect(isVisitTabId("billing")).toBe(false);
  });
});
