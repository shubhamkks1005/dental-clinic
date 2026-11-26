import type { Doctor } from "@clinic/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../../api/client";
import { refreshFailure } from "../../ui/refresh-fail";
import { useVisibleInterval } from "../../ui/useVisibleInterval";
import { AUTO_REFRESH_MS } from "../../ui/visible-interval";
import {
  listAppointmentRange,
  listDoctors,
  type DayAppointment,
  type DayAppointmentsReply,
} from "./api";

export type CalendarData = {
  days: DayAppointmentsReply[] | null;
  /** First load failed: nothing to show. */
  loadError: string | null;
  /** A refresh failed: the last list stays with this line and Retry (P7.2.2). */
  refreshError: string | null;
  doctors: Doctor[];
  reload: () => void;
  /** Put a just-booked server row on screen at once (fold morph target), before the refresh. */
  insertRow: (row: DayAppointment) => void;
};

// One request for the shown days (week: 7, day: 1), refreshed every 60 s while visible, after
// every action and when the tab comes back. A refresh never closes an open popover.
export function useCalendarData(from: string, to: string): CalendarData {
  const [days, setDays] = useState<DayAppointmentsReply[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const shown = useRef("");
  shown.current = days?.[0]?.dateLocal === from && days.length > 0 ? from : "";
  // Lessons: a refresh that started before a local change may bring old data back; drop it.
  const localChanges = useRef(0);
  const seq = useRef(0);

  const load = useCallback(() => {
    const mine = ++seq.current;
    const changesAtStart = localChanges.current;
    listAppointmentRange(from, to)
      .then((next) => {
        if (mine !== seq.current) return;
        if (changesAtStart !== localChanges.current) {
          window.setTimeout(load, 300);
          return;
        }
        setDays(next);
        setLoadError(null);
        setRefreshError(null);
      })
      .catch((e: unknown) => {
        if (mine !== seq.current) return;
        const fail = refreshFailure(
          shown.current === from,
          e instanceof ApiError && e.status !== 0
            ? e.message
            : "Could not load the week. Check the connection, then try again.",
        );
        if (fail.keepData) setRefreshError(fail.error);
        else {
          setDays(null);
          setLoadError(fail.error);
        }
      });
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);
  useVisibleInterval(load, AUTO_REFRESH_MS);

  useEffect(() => {
    listDoctors()
      .then(setDoctors)
      .catch(() => setDoctors([]));
  }, []);

  const insertRow = useCallback(
    (row: DayAppointment) => {
      localChanges.current += 1;
      setDays((list) =>
        list
          ? list.map((d) =>
              d.dateLocal === row.dateLocal
                ? { ...d, appointments: [...d.appointments.filter((a) => a.id !== row.id), row] }
                : d,
            )
          : list,
      );
      // One quiet refresh after the morph (lessons: never reload the whole page at once).
      window.setTimeout(load, 1200);
    },
    [load],
  );

  return { days, loadError, refreshError, doctors, reload: load, insertRow };
}
