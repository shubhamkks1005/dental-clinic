import { describe, expect, it } from "vitest";
import { formatDate, formatDuration, formatMoney, plural } from "./format";

const NOW = new Date("2026-11-24T06:00:00Z");

describe("formatDate", () => {
  it("shows weekday, day and month for this year", () => {
    expect(formatDate("2026-11-24", NOW)).toBe("Tue 24 Nov");
    expect(formatDate("2026-01-05", NOW)).toBe("Mon 5 Jan");
  });
  it("adds the year when it is not this year", () => {
    expect(formatDate("2025-12-31", NOW)).toBe("Wed 31 Dec 2025");
  });
  it("shows an instant as its IST day", () => {
    expect(formatDate(new Date("2026-11-23T20:00:00Z"), NOW)).toBe("Tue 24 Nov");
  });
  it("never shows an ISO date", () => {
    expect(formatDate("2026-11-24T10:00:00.000Z", NOW)).not.toMatch(/\d{4}-\d{2}/);
  });
});

describe("formatDuration", () => {
  it("reads like the design", () => {
    expect(formatDuration(623)).toBe("10 h 23 min");
    expect(formatDuration(0.4)).toBe("Under 1 min");
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(120)).toBe("2 h");
  });
});

describe("formatMoney and plural", () => {
  it("shows paise only when not zero", () => {
    expect(formatMoney(250000)).toBe("₹2,500");
    expect(formatMoney(64950)).toBe("₹649.50");
  });
  it("uses one plural rule", () => {
    expect(plural(1, "appointment")).toBe("1 appointment");
    expect(plural(0, "appointment")).toBe("0 appointments");
    expect(plural(2, "person", "people")).toBe("2 people");
  });
});
