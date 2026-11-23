import { DAY_KEYS, toMinutes, type Timings } from "./timings";
import { formatClockTime } from "./time";

const SHORT: Record<(typeof DAY_KEYS)[number], string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

type Day = Timings["week"]["mon"];

function sessions(d: Day): string {
  if (!d.open) return "Closed";
  const range = (a: string, b: string) =>
    `${formatClockTime(toMinutes(a))} - ${formatClockTime(toMinutes(b))}`;
  if (d.lunchStart && d.lunchEnd) {
    return `${range(d.start, d.lunchStart)}, ${range(d.lunchEnd, d.end)}`;
  }
  return range(d.start, d.end);
}

/** Letterhead "Consultation Timings" lines from Settings, e.g. "Mon-Sat: 10:00 AM - 1:00 PM, 2:00 PM - 6:00 PM". */
export function consultationTimingsLines(timings: Timings): string[] {
  const lines: string[] = [];
  let i = 0;
  while (i < DAY_KEYS.length) {
    const text = sessions(timings.week[DAY_KEYS[i]!]);
    let j = i;
    while (j + 1 < DAY_KEYS.length && sessions(timings.week[DAY_KEYS[j + 1]!]) === text) j += 1;
    const first = SHORT[DAY_KEYS[i]!];
    const last = SHORT[DAY_KEYS[j]!];
    lines.push(`${i === j ? first : `${first}-${last}`}: ${text}`);
    i = j + 1;
  }
  return lines;
}
