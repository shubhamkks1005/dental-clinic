import { describe, expect, it } from "vitest";
import { dayKeyOf, holidaysSchema, timingsSchema, workingSlots, type Timings } from "./timings";

const open = (start: string, end: string, lunch: [string, string] | null = null) => ({
  open: true,
  start,
  end,
  lunchStart: lunch?.[0] ?? null,
  lunchEnd: lunch?.[1] ?? null,
});
const closed = { open: false, start: "10:00", end: "19:00", lunchStart: null, lunchEnd: null };
const timings: Timings = {
  week: {
    mon: open("10:00", "12:00", ["11:00", "11:30"]),
    tue: open("10:00", "11:00"),
    wed: open("10:00", "11:00"),
    thu: open("10:00", "11:00"),
    fri: open("10:00", "11:00"),
    sat: open("10:00", "11:00"),
    sun: closed,
  },
  slotMinutes: 30,
  chairs: 1,
};

describe("clinic timings (1.5.3)", () => {
  it("knows the weekday of a date", () => {
    expect(dayKeyOf("2026-11-22")).toBe("sun");
    expect(dayKeyOf("2026-11-23")).toBe("mon");
  });

  it("makes slots from opening hours, skipping lunch; the last slot ends by closing time", () => {
    expect(workingSlots("2026-11-23", timings, [])).toEqual(["10:00", "10:30", "11:30"]);
    expect(workingSlots("2026-11-24", { ...timings, slotMinutes: 45 }, [])).toEqual(["10:00"]);
  });

  it("no slots on a closed day or a holiday", () => {
    expect(workingSlots("2026-11-22", timings, [])).toEqual([]);
    expect(
      workingSlots("2026-11-23", timings, [{ date: "2026-11-23", note: "Sample holiday" }]),
    ).toEqual([]);
  });

  it("refuses closing before opening, half-filled lunch, lunch outside hours", () => {
    const bad = (mon: object) =>
      timingsSchema.safeParse({ ...timings, week: { ...timings.week, mon } });
    expect(bad(open("12:00", "10:00")).error?.issues[0]?.message).toBe(
      "Closing time must be after opening time.",
    );
    expect(bad({ ...open("10:00", "12:00"), lunchStart: "11:00" }).error?.issues[0]?.message).toBe(
      "Enter both lunch times, or neither.",
    );
    expect(bad(open("10:00", "12:00", ["09:00", "09:30"])).error?.issues[0]?.message).toBe(
      "Lunch must fit inside the opening hours.",
    );
    expect(bad(closed).success).toBe(true);
  });

  it("slot length from the list, 1-10 chairs, HH:MM times", () => {
    expect(timingsSchema.safeParse({ ...timings, slotMinutes: 7 }).success).toBe(false);
    expect(timingsSchema.safeParse({ ...timings, chairs: 0 }).success).toBe(false);
    expect(
      timingsSchema.safeParse({ ...timings, week: { ...timings.week, tue: open("9:00", "11:00") } })
        .success,
    ).toBe(false);
  });

  it("holidays need real, distinct dates", () => {
    expect(holidaysSchema.safeParse([{ date: "2026-12-25", note: "Sample" }]).success).toBe(true);
    expect(holidaysSchema.safeParse([{ date: "2026-02-30", note: "" }]).success).toBe(false);
    const twice = [
      { date: "2026-12-25", note: "" },
      { date: "2026-12-25", note: "again" },
    ];
    expect(holidaysSchema.safeParse(twice).error?.issues[0]?.message).toBe(
      "Each date can be listed once.",
    );
  });
});
