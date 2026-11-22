import { describe, expect, it } from "vitest";
import type { Timings } from "./timings";
import { dayWindow, emptySlotStarts, snapToSlot } from "./day-view";

const timings: Timings = {
  slotMinutes: 15,
  chairs: 1,
  week: {
    mon: { open: true, start: "10:00", end: "13:00", lunchStart: null, lunchEnd: null },
    tue: { open: true, start: "10:00", end: "13:00", lunchStart: null, lunchEnd: null },
    wed: { open: true, start: "10:00", end: "13:00", lunchStart: null, lunchEnd: null },
    thu: { open: true, start: "10:00", end: "13:00", lunchStart: null, lunchEnd: null },
    fri: { open: true, start: "10:00", end: "13:00", lunchStart: null, lunchEnd: null },
    sat: { open: true, start: "10:00", end: "13:00", lunchStart: null, lunchEnd: null },
    sun: { open: false, start: "10:00", end: "13:00", lunchStart: null, lunchEnd: null },
  },
};

describe("day view helpers (2.4.1)", () => {
  it("builds open window from timings", () => {
    const w = dayWindow("2026-11-23", timings, []);
    expect(w.closed).toBe(false);
    expect(w.dayStartMin).toBe(10 * 60);
    expect(w.dayEndMin).toBe(13 * 60);
  });

  it("marks Sunday closed", () => {
    expect(dayWindow("2026-11-22", timings, []).closed).toBe(true);
  });

  it("snaps to slot grid", () => {
    expect(snapToSlot(10 * 60 + 7, 15, 10 * 60)).toBe(10 * 60);
    expect(snapToSlot(10 * 60 + 15, 15, 10 * 60)).toBe(10 * 60 + 15);
  });

  it("lists empty slots skipping busy", () => {
    const w = dayWindow("2026-11-23", timings, []);
    const slots = emptySlotStarts(w, [{ startMin: 10 * 60, endMin: 10 * 60 + 30 }]);
    expect(slots[0]).toBe(10 * 60 + 30);
    expect(slots).not.toContain(10 * 60);
    expect(slots).not.toContain(10 * 60 + 15);
  });
});
