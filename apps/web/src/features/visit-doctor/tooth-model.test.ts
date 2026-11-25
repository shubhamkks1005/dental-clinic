import type { ToothHistoryEntry } from "@clinic/shared";
import { describe, expect, it } from "vitest";
import { entryText, historyDate, oneLineHistory, toothName } from "./tooth-model";

const entry = (over: Partial<ToothHistoryEntry>): ToothHistoryEntry => ({
  id: "e1",
  at: "2026-11-22T06:00:00.000Z",
  kind: "procedure",
  toothFdi: 36,
  title: "RCT started",
  note: null,
  visitId: "v1",
  isToday: false,
  fileId: null,
  surfaces: [],
  fromTooth: null,
  ...over,
});
const label = (code: string) => (code === "deep" ? "Deep cavity" : code);

describe("tooth words", () => {
  it("names permanent and baby teeth", () => {
    expect(toothName(36)).toBe("Lower left first molar");
    expect(toothName(11)).toBe("Upper right central incisor");
    expect(toothName(48)).toBe("Lower right third molar");
    expect(toothName(54)).toBe("Baby upper right first molar");
    expect(toothName(85)).toBe("Baby lower right second molar");
    expect(toothName(99)).toBe("Tooth 99");
  });

  it("dates use the clinic day, not the device", () => {
    expect(historyDate("2026-11-22T06:00:00.000Z")).toBe("22 Nov 2026");
    // 20:00 UTC is already the next day in India.
    expect(historyDate("2026-11-22T20:00:00.000Z")).toBe("23 Nov 2026");
  });

  it("rows say the list word, never the raw code", () => {
    expect(entryText(entry({ kind: "chart", title: "deep", surfaces: ["o", "d"] }), label)).toBe(
      "Deep cavity marked (O, D)",
    );
    expect(entryText(entry({}), label)).toBe("RCT started");
    expect(entryText(entry({ kind: "diagnosis", title: "Pulpitis" }), label)).toBe("Pulpitis");
  });

  it("one line is the first two rows, or the empty sentence", () => {
    expect(
      oneLineHistory(
        [
          entry({}),
          entry({ kind: "diagnosis", title: "Cold sensitivity", at: "2026-11-08T06:00:00.000Z" }),
          entry({ title: "Third" }),
        ],
        label,
      ),
    ).toBe("22 Nov 2026 — RCT started · 8 Nov 2026 — Cold sensitivity");
    expect(oneLineHistory([], label)).toBe("No prior treatment recorded on this tooth.");
  });
});
