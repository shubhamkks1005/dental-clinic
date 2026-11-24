import { addIstDays } from "@clinic/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { refreshFailure } from "../../ui/refresh-fail";
import { listDayAppointments, type DayAppointmentsReply } from "./api";

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

/** The seven days of the week, one request each (same endpoint as the day view). */
export function useWeek(active: boolean, day: string, refreshKey: number) {
  const [days, setDays] = useState<DayAppointmentsReply[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const first = weekStart(day);
  // Old data counts only if it is for this same week.
  const hasWeek = useRef(false);
  hasWeek.current = days?.[0]?.dateLocal === first;

  const load = useCallback(() => {
    if (!active) return;
    Promise.all(weekDays(first).map((d) => listDayAppointments(d)))
      .then((next) => {
        setDays(next);
        setError(null);
      })
      .catch(() => {
        const fail = refreshFailure(
          hasWeek.current,
          "Could not load the week. Check the connection, then try again.",
        );
        if (!fail.keepData) setDays(null);
        setError(fail.error);
      });
  }, [active, first]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return { days, error, reload: load };
}
