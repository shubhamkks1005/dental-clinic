import { describe, expect, it } from "vitest";
import { roundUpToSlot } from "./lists";
import { findFreeSlots, slotSearchEarliest } from "./free-slots";
import { istLocalToUtc } from "./time";
import type { Timings } from "./timings";

const open = (start: string, end: string, lunch: [string, string] | null = ["13:30", "14:30"]) => ({
  open: true,
  start,
  end,
  lunchStart: lunch?.[0] ?? null,
  lunchEnd: lunch?.[1] ?? null,
});
const closed = { open: false, start: "10:00", end: "19:00", lunchStart: null, lunchEnd: null };

// Clinic-like week: Mon–Sat 10:00–19:00, lunch 13:30–14:30, 15 min slots (seed timings).
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

const hhmm = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

const summarise = (slots: { dateLocal: string; startMin: number; endMin: number }[]) =>
  slots.map((s) => `${s.dateLocal} ${hhmm(s.startMin)}-${hhmm(s.endMin)}`);

// Monday 23 Nov 2026 is a working day in the fixture week.
const MON = "2026-11-23";
const dayStart = istLocalToUtc(MON, 0);

describe("free slots (2.3.3)", () => {
  it("1 empty day: first five 20-min visits (rounded to 30) from opening", () => {
    const duration = roundUpToSlot(20, 15);
    const slots = findFreeSlots({
      timings,
      holidays: [],
      durationMin: duration,
      earliest: dayStart,
      busy: [],
    });
    expect(summarise(slots)).toEqual([
      "2026-11-23 10:00-10:30",
      "2026-11-23 10:15-10:45",
      "2026-11-23 10:30-11:00",
      "2026-11-23 10:45-11:15",
      "2026-11-23 11:00-11:30",
    ]);
  });

  it("2 full day: every slot busy → jumps to the next open day", () => {
    const busy = [];
    for (let t = 10 * 60; t < 13 * 60 + 30; t += 15) {
      busy.push({
        dateLocal: MON,
        startMin: t,
        endMin: t + 15,
        status: "scheduled" as const,
      });
    }
    for (let t = 14 * 60 + 30; t < 19 * 60; t += 15) {
      busy.push({
        dateLocal: MON,
        startMin: t,
        endMin: t + 15,
        status: "confirmed" as const,
      });
    }
    const slots = findFreeSlots({
      timings,
      holidays: [],
      durationMin: 15,
      earliest: dayStart,
      busy,
      limit: 2,
    });
    expect(summarise(slots)).toEqual(["2026-11-24 10:00-10:15", "2026-11-24 10:15-10:30"]);
  });

  it("3 near lunch: a 30-min visit cannot start if it would cross lunch", () => {
    const slots = findFreeSlots({
      timings,
      holidays: [],
      durationMin: 30,
      earliest: istLocalToUtc(MON, 13 * 60),
      busy: [],
      limit: 3,
    });
    // 13:00-13:30 fits; 13:15 would end 13:45 (in lunch) — skipped; next after lunch 14:30.
    expect(summarise(slots)).toEqual([
      "2026-11-23 13:00-13:30",
      "2026-11-23 14:30-15:00",
      "2026-11-23 14:45-15:15",
    ]);
  });

  it("4 holiday: no slots that day", () => {
    const slots = findFreeSlots({
      timings,
      holidays: [{ date: MON, note: "Sample holiday" }],
      durationMin: 15,
      earliest: dayStart,
      busy: [],
      limit: 1,
    });
    expect(summarise(slots)).toEqual(["2026-11-24 10:00-10:15"]);
  });

  it("5 half-hour gap: only a 15-min visit fits in a 30-min hole", () => {
    const busy = [
      {
        dateLocal: MON,
        startMin: 10 * 60,
        endMin: 11 * 60,
        status: "scheduled" as const,
      },
      {
        dateLocal: MON,
        startMin: 11 * 60 + 30,
        endMin: 13 * 60,
        status: "scheduled" as const,
      },
    ];
    const short = findFreeSlots({
      timings,
      holidays: [],
      durationMin: 15,
      earliest: dayStart,
      busy,
      limit: 3,
    });
    expect(summarise(short)).toEqual([
      "2026-11-23 11:00-11:15",
      "2026-11-23 11:15-11:30",
      "2026-11-23 13:00-13:15",
    ]);
    const long = findFreeSlots({
      timings,
      holidays: [],
      durationMin: 45,
      earliest: dayStart,
      busy,
      limit: 1,
    });
    // 45 min does not fit in the 30-min hole; first free after busy morning is 14:30.
    expect(summarise(long)).toEqual(["2026-11-23 14:30-15:15"]);
  });

  it("6 forty-five minute RCT needs three free 15-min slots in a row", () => {
    const busy = [
      {
        dateLocal: MON,
        startMin: 10 * 60 + 15,
        endMin: 10 * 60 + 30,
        status: "scheduled" as const,
      },
    ];
    const slots = findFreeSlots({
      timings,
      holidays: [],
      durationMin: roundUpToSlot(45, 15),
      earliest: dayStart,
      busy,
      limit: 2,
    });
    // 10:00-10:45 overlaps the 10:15 busy block; next is 10:30-11:15.
    expect(summarise(slots)).toEqual(["2026-11-23 10:30-11:15", "2026-11-23 10:45-11:30"]);
  });

  it("7 today: search earliest is now + 15 minutes", () => {
    const now = istLocalToUtc(MON, 10 * 60 + 7); // 10:07 IST
    const earliest = slotSearchEarliest(now);
    expect(earliest).toEqual(istLocalToUtc(MON, 10 * 60 + 22));
    const slots = findFreeSlots({
      timings,
      holidays: [],
      durationMin: 15,
      earliest,
      busy: [],
      limit: 1,
    });
    // 10:22 snaps up to 10:30 on the 15-min grid.
    expect(summarise(slots)).toEqual(["2026-11-23 10:30-10:45"]);
  });

  it("8 Sunday closed: skips to Monday", () => {
    const sun = istLocalToUtc("2026-11-22", 12 * 60);
    const slots = findFreeSlots({
      timings,
      holidays: [],
      durationMin: 15,
      earliest: sun,
      busy: [],
      limit: 1,
    });
    expect(summarise(slots)).toEqual(["2026-11-23 10:00-10:15"]);
  });

  it("9 cancelled and no_show do not block a slot", () => {
    const busy = [
      {
        dateLocal: MON,
        startMin: 10 * 60,
        endMin: 10 * 60 + 30,
        status: "cancelled" as const,
      },
      {
        dateLocal: MON,
        startMin: 10 * 60 + 30,
        endMin: 11 * 60,
        status: "no_show" as const,
      },
    ];
    const slots = findFreeSlots({
      timings,
      holidays: [],
      durationMin: 30,
      earliest: dayStart,
      busy,
      limit: 1,
    });
    expect(summarise(slots)).toEqual(["2026-11-23 10:00-10:30"]);
  });

  it("10 rescheduled does not block; completed does not block", () => {
    const busy = [
      {
        dateLocal: MON,
        startMin: 10 * 60,
        endMin: 10 * 60 + 15,
        status: "rescheduled" as const,
      },
      {
        dateLocal: MON,
        startMin: 10 * 60 + 15,
        endMin: 10 * 60 + 30,
        status: "completed" as const,
      },
    ];
    const slots = findFreeSlots({
      timings,
      holidays: [],
      durationMin: 15,
      earliest: dayStart,
      busy,
      limit: 2,
    });
    expect(summarise(slots)).toEqual(["2026-11-23 10:00-10:15", "2026-11-23 10:15-10:30"]);
  });

  it("11 arrived / in_chair still hold the chair", () => {
    const busy = [
      {
        dateLocal: MON,
        startMin: 10 * 60,
        endMin: 10 * 60 + 30,
        status: "arrived" as const,
      },
      {
        dateLocal: MON,
        startMin: 10 * 60 + 30,
        endMin: 11 * 60,
        status: "in_chair" as const,
      },
    ];
    const slots = findFreeSlots({
      timings,
      holidays: [],
      durationMin: 15,
      earliest: dayStart,
      busy,
      limit: 1,
    });
    expect(summarise(slots)).toEqual(["2026-11-23 11:00-11:15"]);
  });

  it("12 stops after the requested limit inside the 14-day window", () => {
    const slots = findFreeSlots({
      timings,
      holidays: [],
      durationMin: 15,
      earliest: dayStart,
      busy: [],
      limit: 5,
    });
    expect(slots).toHaveLength(5);
    expect(slots.every((s) => s.startAt instanceof Date)).toBe(true);
  });
});
