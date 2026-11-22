import { describe, expect, it } from "vitest";
import {
  HISTORY_CLINICAL_ENTRY_TYPES,
  HISTORY_DOCUMENT_FILE_KINDS,
  historyFileKindsForRole,
  historyTypesForRole,
  isHistoryEntryVisible,
} from "./history-feed-visibility";

describe("history feed visibility (3.5.14)", () => {
  it("hides clinical types from receptionist and limits file kinds", () => {
    const recTypes = historyTypesForRole("receptionist");
    for (const t of HISTORY_CLINICAL_ENTRY_TYPES) {
      expect(recTypes.includes(t)).toBe(false);
    }
    expect(recTypes).toEqual(expect.arrayContaining(["appointment", "consent", "file"]));

    expect(historyFileKindsForRole("receptionist")).toEqual([...HISTORY_DOCUMENT_FILE_KINDS]);
    expect(historyFileKindsForRole("doctor")).toBeNull();

    expect(isHistoryEntryVisible("receptionist", { type: "visit", status: "final" })).toBe(false);
    expect(isHistoryEntryVisible("receptionist", { type: "file", status: "iopa" })).toBe(false);
    expect(isHistoryEntryVisible("receptionist", { type: "file", status: "scan" })).toBe(true);
    expect(isHistoryEntryVisible("doctor", { type: "visit", status: "draft" })).toBe(true);
  });
});
