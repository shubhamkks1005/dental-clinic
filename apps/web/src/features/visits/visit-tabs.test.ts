import { describe, expect, it } from "vitest";
import { isVisitTabId, VISIT_TAB_IDS, VISIT_TAB_LABEL } from "./visit-tabs";

describe("visit tabs (Q2.4)", () => {
  it("has the one-screen Visit tab and keeps Plan, History and Files", () => {
    expect([...VISIT_TAB_IDS]).toEqual(["visit", "plan", "history", "files"]);
    expect(VISIT_TAB_LABEL.visit).toBe("Visit");
    expect(isVisitTabId("plan")).toBe(true);
    expect(isVisitTabId("medicines")).toBe(false);
  });
});
