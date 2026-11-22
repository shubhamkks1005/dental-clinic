import { describe, expect, it } from "vitest";
import {
  financialYearOf,
  formatDisplayDate,
  istDate,
  istDateTime,
  istHour,
  istLongDate,
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

  it("gives the IST hour", () => {
    expect(istHour(new Date("2026-11-22T03:30:00Z"))).toBe(9);
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
