import { describe, expect, it } from "vitest";
import {
  addIstDays,
  financialYearOf,
  formatClockTime,
  formatDisplayDate,
  istDate,
  istDateTime,
  istHour,
  istLocalToUtc,
  istLongDate,
  istMinutes,
  parseDisplayDate,
} from "./time";

describe("DD/MM/YYYY dates (1.4.4)", () => {
  it("reads DD/MM/YYYY (also - or . and single digits) into YYYY-MM-DD", () => {
    expect(parseDisplayDate("22/11/2026")).toBe("2026-11-22");
    expect(parseDisplayDate(" 2-3-2026 ")).toBe("2026-03-02");
    expect(parseDisplayDate("29.02.2028")).toBe("2028-02-29");
  });

  it("refuses dates that do not exist and other shapes", () => {
    for (const raw of ["31/04/2026", "29/02/2027", "2026-11-22", "22/11/26", "", "aa/bb/cccc"]) {
      expect(parseDisplayDate(raw)).toBeNull();
    }
  });

  it("shows a stored date as DD/MM/YYYY", () => {
    expect(formatDisplayDate("2026-03-02")).toBe("02/03/2026");
  });
});

describe("istLongDate and istHour", () => {
  it("formats the IST day for headers", () => {
    expect(istLongDate(new Date("2026-11-21T19:00:00Z"))).toBe("Sunday, 22 November");
  });

  it("gives the IST hour and minutes from midnight", () => {
    expect(istHour(new Date("2026-11-22T03:30:00Z"))).toBe(9);
    expect(istMinutes(new Date("2026-11-22T04:30:00Z"))).toBe(10 * 60); // 10:00 IST
  });

  it("adds IST calendar days and converts local minutes back to UTC", () => {
    expect(addIstDays("2026-11-22", 1)).toBe("2026-11-23");
    expect(istLocalToUtc("2026-11-23", 10 * 60).toISOString()).toBe("2026-11-23T04:30:00.000Z");
  });

  it("formats a stored UTC time as a short IST date and time", () => {
    expect(istDateTime(new Date("2026-11-22T12:40:00Z"))).toBe("22 Nov 2026, 6:10 pm");
    expect(istDateTime(new Date("2026-11-21T19:00:00Z"))).toBe("22 Nov 2026, 12:30 am");
  });
});

describe("istDate", () => {
  it("uses the IST calendar day, not the UTC one", () => {
    expect(istDate(new Date("2026-11-21T18:29:59Z"))).toBe("2026-11-21");
    expect(istDate(new Date("2026-11-21T18:30:00Z"))).toBe("2026-11-22");
  });
});

describe("financialYearOf", () => {
  it("changes at midnight IST on 1 April", () => {
    expect(financialYearOf(new Date("2027-03-31T18:29:59Z"))).toBe("2026-27");
    expect(financialYearOf(new Date("2027-03-31T18:30:00Z"))).toBe("2027-28");
  });

  it("handles January to March as the previous start year", () => {
    expect(financialYearOf(new Date("2027-01-15T06:00:00Z"))).toBe("2026-27");
  });

  it("pads the century turn", () => {
    expect(financialYearOf(new Date("2099-06-01T00:00:00Z"))).toBe("2099-00");
  });
});

describe("formatClockTime (AM/PM for staff)", () => {
  it("shows minutes since midnight as a 12-hour time with AM or PM", () => {
    expect(formatClockTime(0)).toBe("12:00 AM");
    expect(formatClockTime(9 * 60 + 5)).toBe("9:05 AM");
    expect(formatClockTime(12 * 60)).toBe("12:00 PM");
    expect(formatClockTime(13 * 60 + 30)).toBe("1:30 PM");
    expect(formatClockTime(18 * 60 + 45)).toBe("6:45 PM");
    expect(formatClockTime(23 * 60 + 59)).toBe("11:59 PM");
  });
});
