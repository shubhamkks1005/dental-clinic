import type { DayWindow } from "@clinic/shared";
import { describe, expect, it } from "vitest";
import {
  cardBox,
  cellState,
  firstStartInCell,
  gapsOf,
  gridSpan,
  hourLabel,
  nextOpenStart,
  previewHeight,
  rangeLabel,
  sharedGaps,
  snapInHour,
} from "./cal-geometry";

const day = (dateLocal: string, intervals: [number, number][]): DayWindow => ({
  dateLocal,
  dayStartMin: intervals.length ? intervals[0]![0] : 0,
  dayEndMin: intervals.length ? intervals[intervals.length - 1]![1] : 0,
  slotMinutes: 15,
  intervals,
  closed: intervals.length === 0,
});
const MON = day("2026-11-23", [
  [600, 780],
  [840, 1200],
]);
const TUE = day("2026-11-24", [
  [570, 780],
  [840, 1140],
]);
const SUN = day("2026-11-29", []);

describe("calendar geometry", () => {
  it("spans whole hours of the open days and widens for late entries", () => {
    expect(gridSpan([MON, TUE, SUN])).toEqual({ start: 540, end: 1200 });
    expect(gridSpan([SUN])).toEqual({ start: 540, end: 1080 });
    expect(gridSpan([MON], [{ startMin: 1230, endMin: 1260 }])).toEqual({ start: 600, end: 1260 });
  });

  it("places cards at 64 px per hour and previews like the HTML", () => {
    expect(cardBox(630, 660, { start: 600, end: 1200 })).toEqual({ top: 34, height: 28 });
    expect(cardBox(600, 605, { start: 600, end: 1200 }).height).toBe(22);
    expect(previewHeight(30)).toBe(34);
    expect(previewHeight(60)).toBe(56);
    expect(previewHeight(75)).toBe(72);
  });

  it("snaps a click to 15 minutes inside the hour", () => {
    expect(snapInHour(600, 0)).toBe(600);
    expect(snapInHour(600, 17)).toBe(615);
    expect(snapInHour(600, 63)).toBe(645);
    expect(snapInHour(600, 200)).toBe(645);
  });

  it("finds lunch gaps, and only the ones all open days share", () => {
    expect(gapsOf(MON)).toEqual([[780, 840]]);
    expect(sharedGaps([MON, TUE, SUN])).toEqual([[780, 840]]);
    expect(sharedGaps([MON, day("2026-11-25", [[600, 1200]])])).toEqual([]);
  });

  it("marks cells past, closed, off or open", () => {
    const now = { date: "2026-11-23", min: 650 };
    expect(cellState(MON, 600, now)).toBe("open");
    expect(cellState(MON, 540, now)).toBe("past");
    expect(cellState(MON, 780, now)).toBe("off");
    expect(cellState(SUN, 600, now)).toBe("closed");
    expect(cellState(day("2026-11-22", [[600, 700]]), 600, now)).toBe("past");
  });

  it("never starts a cell click before now or before opening", () => {
    const now = { date: "2026-11-23", min: 652 };
    expect(firstStartInCell(MON, 600, 600, now)).toBe(660);
    expect(firstStartInCell(TUE, 540, 540, now)).toBe(570);
  });

  it("gives the header Book the next open 15-minute time", () => {
    expect(nextOpenStart([MON, TUE], { date: "2026-11-23", min: 652 })).toEqual({
      dateLocal: "2026-11-23",
      startMin: 660,
    });
    expect(nextOpenStart([MON, TUE], { date: "2026-11-23", min: 1199 })).toEqual({
      dateLocal: "2026-11-24",
      startMin: 570,
    });
    expect(nextOpenStart([SUN], { date: "2026-11-29", min: 0 })).toBeNull();
  });

  it("writes times like the HTML", () => {
    expect(hourLabel(480)).toBe("08:00 AM");
    expect(hourLabel(780)).toBe("01:00 PM");
    expect(rangeLabel(720, 30)).toBe("12:00 PM – 12:30 PM (30m)");
  });
});
