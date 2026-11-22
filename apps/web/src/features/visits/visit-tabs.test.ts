import { describe, expect, it } from "vitest";
import { isVisitTabId, VISIT_TAB_IDS, VISIT_TAB_LABEL } from "./visit-tabs";

describe("visit tabs (3.5.2)", () => {
  it("has the S05 tabs including Medicines (4.2.2)", () => {
    expect([...VISIT_TAB_IDS]).toEqual(["today", "chart", "plan", "medicines", "history", "files"]);
    expect(VISIT_TAB_LABEL.today).toBe("Today's visit");
    expect(VISIT_TAB_LABEL.medicines).toBe("Medicines");
    expect(isVisitTabId("chart")).toBe(true);
    expect(isVisitTabId("billing")).toBe(false);
  });
});
