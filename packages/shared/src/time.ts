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

// Minutes from IST midnight (0..1439). Used with appointments.start_min / end_min.
export function istMinutes(instant: Date): number {
  const ist = inIst(instant);
  return ist.getUTCHours() * 60 + ist.getUTCMinutes();
}

// YYYY-MM-DD plus whole calendar days in IST (no DST in India).
export function addIstDays(isoDay: string, days: number): string {
  const [y, m, d] = isoDay.split("-").map(Number) as [number, number, number];
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return next.toISOString().slice(0, 10);
}

// Instant for an IST local date + minutes-from-midnight, as UTC Date.
export function istLocalToUtc(isoDay: string, minutesFromMidnight: number): Date {
  const [y, m, d] = isoDay.split("-").map(Number) as [number, number, number];
  const utcMs =
    Date.UTC(y, m - 1, d, 0, 0, 0) - (5 * 60 + 30) * 60 * 1000 + minutesFromMidnight * 60 * 1000;
  return new Date(utcMs);
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

// THE date entry and display format (DD/MM/YYYY). Stored dates are YYYY-MM-DD (*_on columns).
// Accepts / - or . between parts and 1-digit day or month; rejects dates that do not exist.
export function parseDisplayDate(raw: string): string | null {
  const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(raw.trim());
  if (!m) return null;
  const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  const real =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return real ? date.toISOString().slice(0, 10) : null;
}

export function formatDisplayDate(stored: string): string {
  const [year, month, day] = stored.split("-");
  return `${day}/${month}/${year}`;
}

// Financial year April-March by the IST date, e.g. "2026-27". Used as the counters period.
export function financialYearOf(instant: Date): string {
  const ist = inIst(instant);
  const startYear = ist.getUTCMonth() >= 3 ? ist.getUTCFullYear() : ist.getUTCFullYear() - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}
