import { describe, expect, it } from "vitest";
import { historyStatusWord } from "./history-status";

describe("history status words", () => {
  it("uses the shared words for appointments and visits", () => {
    expect(historyStatusWord("appointment", "in_chair").label).toBe("In chair");
    expect(historyStatusWord("visit", "draft")).toMatchObject({ label: "Draft", tone: "upcoming" });
  });
  it("bills: issued is Issued, cancelled is struck", () => {
    expect(historyStatusWord("bill", "issued").label).toBe("Issued");
    expect(historyStatusWord("bill", "cancelled").struck).toBe(true);
  });
  it("other rows are capitalised, green only for good outcomes", () => {
    expect(historyStatusWord("payment", "received")).toMatchObject({
      label: "Received",
      tone: "done",
    });
    expect(historyStatusWord("refund", "refunded")).toMatchObject({
      label: "Refunded",
      tone: "upcoming",
    });
    expect(historyStatusWord("consent", "withdrawn").label).toBe("Withdrawn");
  });
});
