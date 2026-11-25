import { describe, expect, it } from "vitest";
import {
  cursorOf,
  mergeToothHistory,
  newerFirst,
  parseHistoryCursor,
  type ToothHistoryRow,
} from "./tooth-history";

let n = 0;
const row = (over: Partial<ToothHistoryRow> & { at: string }): ToothHistoryRow => ({
  id: `r${String(++n).padStart(4, "0")}`,
  kind: "chart",
  toothFdi: 36,
  title: "caries",
  surfaces: ["o"],
  note: null,
  visitId: null,
  isToday: false,
  fileId: null,
  ...over,
});
const day = (d: number, h = 5) =>
  `2026-10-${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}:00:00.000Z`;

describe("mergeToothHistory (B10)", () => {
  it("merges sources newest first and breaks ties by id", () => {
    const a = row({ at: day(3), kind: "procedure", title: "RCT started", surfaces: [] });
    const b = row({ at: day(5), kind: "diagnosis", title: "Pulpitis", surfaces: [] });
    const c = row({ at: day(5), kind: "file", title: "xray.jpg", surfaces: [] });
    const page = mergeToothHistory(
      [
        { rows: [a], truncated: false },
        { rows: [b, c], truncated: false },
      ],
      null,
    );
    expect(page.entries.map((e) => e.id)).toEqual([c.id, b.id, a.id]);
    expect(page.next).toBeNull();
  });

  it("groups neighbouring chart marks of one visit into one entry with its surfaces", () => {
    const v = "visit-1";
    const o = row({ at: day(4, 5), visitId: v, surfaces: ["o"] });
    const d = row({ at: day(4, 6), visitId: v, surfaces: ["d"] });
    const other = row({ at: day(4, 7), visitId: v, title: "filling", surfaces: ["m"] });
    const page = mergeToothHistory([{ rows: [o, d, other], truncated: false }], null);
    expect(page.entries).toHaveLength(2);
    expect(page.entries[0]).toMatchObject({ title: "filling", surfaces: ["m"] });
    expect(page.entries[1]).toMatchObject({ title: "caries", surfaces: ["o", "d"] });
  });

  it("does not group marks of different visits or marks split by another entry", () => {
    const a = row({ at: day(4, 5), visitId: "v1", surfaces: ["o"] });
    const b = row({ at: day(4, 7), visitId: "v1", surfaces: ["d"] });
    const mid = row({ at: day(4, 6), kind: "procedure", title: "Cleaning", surfaces: [] });
    const c = row({ at: day(2), visitId: "v0", surfaces: ["o"] });
    const page = mergeToothHistory([{ rows: [a, b, mid, c], truncated: false }], null);
    expect(page.entries.map((e) => e.surfaces)).toEqual([["d"], [], ["o"], ["o"]]);
  });

  it("pages 25 entries as 20 then 5 with no repeat (test case 21)", () => {
    const all = Array.from({ length: 25 }, (_, i) =>
      row({ at: day(1 + i, 5), kind: "diagnosis", title: `Dx ${i}`, surfaces: [] }),
    );
    const byAge = [...all].sort(newerFirst);
    const ask = (cursor: string | null) => {
      const c = parseHistoryCursor(cursor);
      const past = c ? byAge.filter((r) => newerFirst(r, c) > 0) : byAge;
      const rows = past.slice(0, 21);
      return mergeToothHistory([{ rows, truncated: rows.length === 21 }], null);
    };
    const first = ask(null);
    expect(first.entries).toHaveLength(20);
    expect(first.next).not.toBeNull();
    const second = ask(first.next);
    expect(second.entries).toHaveLength(5);
    expect(second.next).toBeNull();
    const ids = [...first.entries, ...second.entries].map((e) => e.id);
    expect(new Set(ids).size).toBe(25);
    expect(ids).toEqual(byAge.map((r) => r.id));
  });

  it("holds back rows older than the bound of a cut-short source", () => {
    // Files were cut short at day 20; diagnoses reach back to day 1. Day 10 must wait.
    const files = Array.from({ length: 21 }, (_, i) =>
      row({ at: day(30 - i), kind: "file", title: `f${i}`, surfaces: [] }),
    );
    const dx = row({ at: day(10), kind: "diagnosis", title: "Old", surfaces: [] });
    const page = mergeToothHistory(
      [
        { rows: files, truncated: true },
        { rows: [dx], truncated: false },
      ],
      null,
    );
    expect(page.entries.map((e) => e.id)).not.toContain(dx.id);
    expect(page.entries).toHaveLength(20);
    expect(page.next).toBe(cursorOf(files[19] as ToothHistoryRow));
  });

  it("tags rows of the linked baby tooth", () => {
    const baby = row({
      at: day(2),
      toothFdi: 54,
      kind: "procedure",
      title: "Filling",
      surfaces: [],
    });
    const own = row({
      at: day(9),
      toothFdi: 14,
      kind: "diagnosis",
      title: "Caries",
      surfaces: [],
    });
    const page = mergeToothHistory([{ rows: [baby, own], truncated: false }], 54);
    expect(page.entries.map((e) => e.fromTooth)).toEqual([null, 54]);
  });

  it("flags an entry as today when any of its marks is", () => {
    const a = row({ at: day(4, 5), visitId: "v", surfaces: ["o"] });
    const b = row({ at: day(4, 6), visitId: "v", surfaces: ["d"], isToday: true });
    expect(mergeToothHistory([{ rows: [a, b], truncated: false }], null).entries[0]?.isToday).toBe(
      true,
    );
  });

  it("reads only well-formed cursors", () => {
    expect(parseHistoryCursor(cursorOf({ at: day(3), id: "01ABC" }))).toEqual({
      at: day(3),
      id: "01ABC",
    });
    expect(parseHistoryCursor("nonsense")).toBeNull();
    expect(parseHistoryCursor("2026-10-03T05:00:00.000Z|x'; DROP")).toBeNull();
    expect(parseHistoryCursor(null)).toBeNull();
  });

  it("an empty tooth gives an empty page", () => {
    expect(mergeToothHistory([{ rows: [], truncated: false }], null)).toEqual({
      entries: [],
      next: null,
    });
  });
});
