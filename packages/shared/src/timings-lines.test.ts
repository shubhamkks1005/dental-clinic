import { describe, expect, it } from "vitest";
import { consultationTimingsLines } from "./timings-lines";
import type { Timings } from "./timings";

const open = (start: string, end: string, lunchStart: string | null, lunchEnd: string | null) => ({
  open: true,
  start,
  end,
  lunchStart,
  lunchEnd,
});
const closed: ReturnType<typeof open> = {
  open: false,
  start: "10:00",
  end: "19:00",
  lunchStart: null,
  lunchEnd: null,
};

function week(day: ReturnType<typeof open>, sun = closed): Timings {
  return {
    week: { mon: day, tue: day, wed: day, thu: day, fri: day, sat: day, sun },
    slotMinutes: 15,
    chairs: 1,
  };
}

describe("consultationTimingsLines (letterhead footer)", () => {
  it("joins days with the same hours, splits at lunch, says Closed", () => {
    expect(consultationTimingsLines(week(open("10:00", "18:00", "13:00", "14:00")))).toEqual([
      "Mon-Sat: 10:00 AM - 1:00 PM, 2:00 PM - 6:00 PM",
      "Sun: Closed",
    ]);
  });

  it("no lunch break is one session", () => {
    expect(consultationTimingsLines(week(open("09:00", "17:30", null, null)))).toEqual([
      "Mon-Sat: 9:00 AM - 5:30 PM",
      "Sun: Closed",
    ]);
  });

  it("a different day gets its own line", () => {
    const t = week(open("10:00", "18:00", null, null));
    t.week.sat = open("10:00", "14:00", null, null);
    expect(consultationTimingsLines(t)).toEqual([
      "Mon-Fri: 10:00 AM - 6:00 PM",
      "Sat: 10:00 AM - 2:00 PM",
      "Sun: Closed",
    ]);
  });

  it("all seven days open is Mon-Sun", () => {
    const d = open("10:00", "18:00", null, null);
    expect(consultationTimingsLines(week(d, d))).toEqual(["Mon-Sun: 10:00 AM - 6:00 PM"]);
  });
});
