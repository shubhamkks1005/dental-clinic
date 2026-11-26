import { addIstDays } from "@clinic/shared";

/** Monday of the week that holds `day` (YYYY-MM-DD). */
export function weekStart(day: string): string {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  return addIstDays(day, -((dow + 6) % 7));
}

export function weekDays(day: string): string[] {
  const first = weekStart(day);
  return Array.from({ length: 7 }, (_, i) => addIstDays(first, i));
}
