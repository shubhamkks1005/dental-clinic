import { z } from "zod";
import { parseDisplayDate } from "./time";

// 1.5.3 clinic timings and holidays: the rules (used by the settings store) and the base slot
// list that the Phase 2 calendar (2.3.3) takes away booked time from.
export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayKey = (typeof DAY_KEYS)[number];
export const DAY_NAMES: Record<DayKey, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};
export const SLOT_LENGTHS = [5, 10, 15, 20, 30, 45, 60] as const;

const time = z
  .string({ error: "Enter a time." })
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use the time as HH:MM, for example 09:30.");

export const toMinutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
/** Minutes from midnight → "HH:MM" (appointment start_min / end_min). */
export const toHhmm = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

const dayHours = z
  .object({
    open: z.boolean(),
    start: time,
    end: time,
    lunchStart: time.nullable(),
    lunchEnd: time.nullable(),
  })
  .superRefine((d, ctx) => {
    if (!d.open) return;
    if (toMinutes(d.end) <= toMinutes(d.start)) {
      ctx.addIssue({
        code: "custom",
        path: ["end"],
        message: "Closing time must be after opening time.",
      });
    }
    if ((d.lunchStart === null) !== (d.lunchEnd === null)) {
      ctx.addIssue({
        code: "custom",
        path: ["lunchEnd"],
        message: "Enter both lunch times, or neither.",
      });
      return;
    }
    if (d.lunchStart && d.lunchEnd) {
      const [ls, le] = [toMinutes(d.lunchStart), toMinutes(d.lunchEnd)];
      if (le <= ls || ls < toMinutes(d.start) || le > toMinutes(d.end)) {
        ctx.addIssue({
          code: "custom",
          path: ["lunchEnd"],
          message: "Lunch must fit inside the opening hours.",
        });
      }
    }
  });

export const timingsSchema = z.object({
  week: z.object({
    mon: dayHours,
    tue: dayHours,
    wed: dayHours,
    thu: dayHours,
    fri: dayHours,
    sat: dayHours,
    sun: dayHours,
  }),
  slotMinutes: z
    .number({ error: "Choose a slot length." })
    .refine(
      (v) => (SLOT_LENGTHS as readonly number[]).includes(v),
      "Choose a slot length from the list.",
    ),
  chairs: z
    .number({ error: "Enter the number of chairs." })
    .int("Use a whole number.")
    .min(1, "At least 1 chair.")
    .max(10, "At most 10 chairs."),
});
export type Timings = z.infer<typeof timingsSchema>;

const isoDate = z
  .string()
  .refine(
    (v) =>
      /^\d{4}-\d{2}-\d{2}$/.test(v) && parseDisplayDate(v.split("-").reverse().join("/")) === v,
    "Enter a real date.",
  );

export const holidaysSchema = z
  .array(
    z.object({
      date: isoDate,
      note: z.string().trim().max(60, "Keep the note under 60 letters."),
      /** 6.5.4: repeat every year on the same month-day. */
      yearly: z.boolean().optional(),
    }),
  )
  .max(100, "At most 100 holidays.")
  .refine((list) => {
    const keys = list.map((h) => (h.yearly ? `Y-${h.date.slice(5)}` : h.date));
    return new Set(keys).size === list.length;
  }, "Each date can be listed once.");
export type Holiday = z.infer<typeof holidaysSchema>[number];

/** Fixed national holidays (India). Sister edits in Settings. DRAFT until confirmed. */
export const NATIONAL_HOLIDAY_TEMPLATES: { md: string; note: string }[] = [
  { md: "01-26", note: "Republic Day" },
  { md: "08-15", note: "Independence Day" },
  { md: "10-02", note: "Gandhi Jayanti" },
];

/** Build yearly holiday rows for a calendar year from national templates. */
export function nationalHolidaysForYear(year: number): Holiday[] {
  return NATIONAL_HOLIDAY_TEMPLATES.map((t) => ({
    date: `${year}-${t.md}`,
    note: t.note,
    yearly: true,
  }));
}

/** Merge national yearly holidays into a list without duplicating month-days. */
export function mergeNationalHolidays(existing: Holiday[], year: number): Holiday[] {
  const next = [...existing];
  for (const h of nationalHolidaysForYear(year)) {
    const md = h.date.slice(5);
    if (next.some((e) => (e.yearly ? e.date.slice(5) === md : e.date === h.date))) continue;
    next.push(h);
  }
  return next;
}

/** 6.5.4: exact date or yearly month-day match. */
export function isHolidayOn(isoDay: string, holidays: Holiday[]): boolean {
  const md = isoDay.slice(5);
  return holidays.some((h) => h.date === isoDay || (h.yearly === true && h.date.slice(5) === md));
}

export function dayKeyOf(isoDay: string): DayKey {
  const [y, m, d] = isoDay.split("-").map(Number) as [number, number, number];
  const sundayFirst = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return DAY_KEYS[(sundayFirst + 6) % 7] as DayKey;
}

// Start times ("HH:MM") of every slot the clinic is open on that date: none on closed days and
// holidays, none overlapping lunch, and the last slot ends by closing time.
export function workingSlots(isoDay: string, timings: Timings, holidays: Holiday[]): string[] {
  if (isHolidayOn(isoDay, holidays)) return [];
  const day = timings.week[dayKeyOf(isoDay)];
  if (!day.open) return [];
  const step = timings.slotMinutes;
  const lunch: [number, number] | null =
    day.lunchStart && day.lunchEnd ? [toMinutes(day.lunchStart), toMinutes(day.lunchEnd)] : null;
  const slots: string[] = [];
  for (let t = toMinutes(day.start); t + step <= toMinutes(day.end); t += step) {
    const overlapsLunch = lunch !== null && t < lunch[1] && t + step > lunch[0];
    if (!overlapsLunch) slots.push(toHhmm(t));
  }
  return slots;
}
