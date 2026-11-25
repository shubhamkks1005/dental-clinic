import { describe, expect, it } from "vitest";
import {
  chartFromEvents,
  FDI_ALL,
  FDI_PERMANENT,
  FDI_PRIMARY,
  babyPredecessor,
  isFdiTooth,
  permanentSuccessor,
  isToothSurface,
} from "./teeth";

describe("teeth FDI (3.2.2)", () => {
  it("has 32 permanent and 20 primary codes", () => {
    expect(FDI_PERMANENT).toHaveLength(32);
    expect(FDI_PRIMARY).toHaveLength(20);
    expect(FDI_ALL).toHaveLength(52);
    expect(isFdiTooth(46)).toBe(true);
    expect(isFdiTooth(99)).toBe(false);
    expect(isToothSurface("o")).toBe(true);
    expect(isToothSurface("O")).toBe(false);
    expect(isToothSurface("X")).toBe(false);
  });

  it("builds chart from latest event per tooth+surface", () => {
    const chart = chartFromEvents([
      {
        id: "a",
        toothFdi: 46,
        surface: "o",
        conditionCode: "caries",
        notedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "b",
        toothFdi: 46,
        surface: "o",
        conditionCode: "filling",
        notedAt: "2026-06-01T00:00:00.000Z",
      },
      {
        id: "c",
        toothFdi: 46,
        surface: "m",
        conditionCode: "caries",
        notedAt: "2026-06-01T00:00:00.000Z",
      },
    ]);
    expect(chart).toEqual([
      {
        toothFdi: 46,
        surface: "m",
        conditionCode: "caries",
        notedAt: "2026-06-01T00:00:00.000Z",
        eventId: "c",
        visitId: null,
      },
      {
        toothFdi: 46,
        surface: "o",
        conditionCode: "filling",
        notedAt: "2026-06-01T00:00:00.000Z",
        eventId: "b",
        visitId: null,
      },
    ]);
  });
});

describe("baby and permanent tooth link (section 4c item 6)", () => {
  it("maps every baby tooth to its successor and back", () => {
    for (const baby of FDI_PRIMARY) {
      const perm = permanentSuccessor(baby);
      expect(perm).not.toBeNull();
      expect(perm).toBe(baby - 40);
      expect(babyPredecessor(perm as number)).toBe(baby);
    }
  });

  it("gives permanent molars no baby predecessor", () => {
    for (const t of FDI_PERMANENT) {
      const pos = t % 10;
      if (pos >= 6) expect(babyPredecessor(t)).toBeNull();
      else expect(babyPredecessor(t)).toBe(t + 40);
    }
  });

  it("returns null for the wrong kind of tooth or a bad number", () => {
    expect(permanentSuccessor(14)).toBeNull();
    expect(babyPredecessor(54)).toBeNull();
    expect(babyPredecessor(99)).toBeNull();
    expect(permanentSuccessor(56)).toBeNull();
  });
});
