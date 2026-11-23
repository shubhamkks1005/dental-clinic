import { describe, expect, it } from "vitest";
import {
  isHolidayOn,
  mergeNationalHolidays,
  nationalHolidaysForYear,
  workingSlots,
  type Timings,
} from "./timings";

const open = {
  open: true,
  start: "10:00",
  end: "11:00",
  lunchStart: null,
  lunchEnd: null,
};
const timings: Timings = {
  week: {
    mon: open,
    tue: open,
    wed: open,
    thu: open,
    fri: open,
    sat: open,
    sun: { ...open, open: false },
  },
  slotMinutes: 30,
  chairs: 1,
};

describe("national / yearly holidays (6.5.4)", () => {
  it("seeds three yearly national days and blocks booking that month-day", () => {
    const list = nationalHolidaysForYear(2027);
    expect(list).toHaveLength(3);
    expect(list.every((h) => h.yearly)).toBe(true);
    expect(isHolidayOn("2028-01-26", list)).toBe(true);
    expect(workingSlots("2028-08-15", timings, list)).toEqual([]);
  });

  it("mergeNationalHolidays does not duplicate month-days", () => {
    const once = mergeNationalHolidays([], 2027);
    const twice = mergeNationalHolidays(once, 2028);
    expect(twice).toHaveLength(once.length);
  });
});
