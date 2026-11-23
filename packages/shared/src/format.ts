import { istDate } from "./time";
import { formatRupees } from "./money";

// ONE place for how dates, durations, money and counts read on screen (PA-D05).
// Paper uses dd/mm/yyyy (formatDisplayDate in time.ts); the screen never shows ISO dates.

/** Money on screen: ₹2,500 and ₹649.50 (paise only when not zero). */
export const formatMoney = formatRupees;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * "Tue 24 Nov", with the year when it is not this year ("Tue 24 Nov 2025").
 * Takes a stored day (YYYY-MM-DD) or an instant (shown as its IST day). `now` is only for tests.
 */
export function formatDate(day: string | Date, now: Date = new Date()): string {
  const iso = typeof day === "string" ? day.slice(0, 10) : istDate(day);
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  const base = `${weekday} ${d} ${MONTHS[m - 1]}`;
  return y === Number(istDate(now).slice(0, 4)) ? base : `${base} ${y}`;
}

/** "Under 1 min", "45 min", "2 h", "10 h 23 min". Input is minutes. */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.floor(minutes));
  if (total < 1) return "Under 1 min";
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** "1 appointment", "2 appointments". Pass `many` for irregular words ("1 patient", "2 patients"). */
export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}
