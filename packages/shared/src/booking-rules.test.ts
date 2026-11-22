import { describe, expect, it } from "vitest";
import { bookingRuleViolations } from "./booking-rules";
import type { Timings } from "./timings";

const open = (start: string, end: string, lunch: [string, string] | null = ["13:30", "14:30"]) => ({
  open: true,
  start,
  end,
  lunchStart: lunch?.[0] ?? null,
  lunchEnd: lunch?.[1] ?? null,
});
const closed = { open: false, start: "10:00", end: "19:00", lunchStart: null, lunchEnd: null };

const timings: Timings = {
  week: {
    mon: open("10:00", "19:00"),
    tue: open("10:00", "19:00"),
    wed: open("10:00", "19:00"),
    thu: open("10:00", "19:00"),
    fri: open("10:00", "19:00"),
    sat: open("10:00", "19:00"),
    sun: closed,
  },
  slotMinutes: 15,
  chairs: 1,
};

// Monday 23 Nov 2026 09:00 IST = 03:30 UTC.
const nowMonMorning = new Date("2026-11-23T03:30:00.000Z");

describe("bookingRuleViolations (2.3.5)", () => {
  it("allows a normal weekday morning slot", () => {
    expect(
      bookingRuleViolations({
        slot: { dateLocal: "2026-11-23", startMin: 10 * 60, endMin: 10 * 60 + 30 },
        timings,
        holidays: [],
        bookAheadDays: 90,
        now: nowMonMorning,
      }),
    ).toEqual([]);
  });

  it("past: refuses a start before now", () => {
    const v = bookingRuleViolations({
      slot: { dateLocal: "2026-11-23", startMin: 8 * 60, endMin: 8 * 60 + 30 },
      timings,
      holidays: [],
      bookAheadDays: 90,
      now: nowMonMorning,
    });
    expect(v.map((x) => x.code)).toContain("past");
  });

  it("closed: refuses Sunday and holidays", () => {
    expect(
      bookingRuleViolations({
        slot: { dateLocal: "2026-11-22", startMin: 10 * 60, endMin: 10 * 60 + 30 },
        timings,
        holidays: [],
        bookAheadDays: 90,
        now: nowMonMorning,
      }).map((x) => x.code),
    ).toContain("closed");
    expect(
      bookingRuleViolations({
        slot: { dateLocal: "2026-11-23", startMin: 10 * 60, endMin: 10 * 60 + 30 },
        timings,
        holidays: [{ date: "2026-11-23", note: "Sample" }],
        bookAheadDays: 90,
        now: nowMonMorning,
      }).map((x) => x.code),
    ).toContain("closed");
  });

  it("lunch: refuses a visit that crosses lunch", () => {
    expect(
      bookingRuleViolations({
        slot: { dateLocal: "2026-11-23", startMin: 13 * 60 + 15, endMin: 13 * 60 + 45 },
        timings,
        holidays: [],
        bookAheadDays: 90,
        now: nowMonMorning,
      }).map((x) => x.code),
    ).toContain("lunch");
  });

  it("ahead: refuses beyond book_ahead_days", () => {
    expect(
      bookingRuleViolations({
        slot: { dateLocal: "2027-03-01", startMin: 10 * 60, endMin: 10 * 60 + 30 },
        timings,
        holidays: [],
        bookAheadDays: 90,
        now: nowMonMorning,
      }).map((x) => x.code),
    ).toContain("ahead");
  });
});
