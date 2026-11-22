// Times are stored in UTC and shown in IST. India has no daylight saving, so IST is always UTC+05:30.
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

function inIst(instant: Date): Date {
  return new Date(instant.getTime() + IST_OFFSET_MS);
}

// Local clinic date as YYYY-MM-DD (the format of every *_on column).
export function istDate(instant: Date): string {
  return inIst(instant).toISOString().slice(0, 10);
}

// Hour of the day in IST, 0-23.
export function istHour(instant: Date): number {
  return inIst(instant).getUTCHours();
}

// Long date for screen headers, e.g. "Saturday, 22 November".
export function istLongDate(instant: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).formatToParts(inIst(instant));
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${part("weekday")}, ${part("day")} ${part("month")}`;
}

// Short date and time, e.g. "22 Nov 2026, 6:10 pm".
export function istDateTime(instant: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).formatToParts(inIst(instant));
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${part("day")} ${part("month")} ${part("year")}, ${part("hour")}:${part("minute")} ${part("dayPeriod").toLowerCase()}`;
}

// Financial year April-March by the IST date, e.g. "2026-27". Used as the counters period.
export function financialYearOf(instant: Date): string {
  const ist = inIst(instant);
  const startYear = ist.getUTCMonth() >= 3 ? ist.getUTCFullYear() : ist.getUTCFullYear() - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}
