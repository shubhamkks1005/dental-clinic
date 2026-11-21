import { describe, expect, it } from "vitest";
import { financialYearOf, istDate, istHour, istLongDate } from "./time";

describe("istLongDate and istHour", () => {
  it("formats the IST day for headers", () => {
    expect(istLongDate(new Date("2026-11-21T19:00:00Z"))).toBe("Sunday, 22 November");
  });

  it("gives the IST hour", () => {
    expect(istHour(new Date("2026-11-22T03:30:00Z"))).toBe(9);
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
