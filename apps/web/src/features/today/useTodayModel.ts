import { istDate, type AppointmentStatus } from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { useVisibleInterval } from "../../ui/useVisibleInterval";
import { AUTO_REFRESH_MS } from "../../ui/visible-interval";
import { changeAppointmentStatus, listDayAppointments } from "./api";
import { buildTodayModel, type TodayModel } from "./buildTodayModel";

/** Today's rows from the server, refreshed while the tab is visible, plus the status change action. */
export function useTodayModel() {
  const [model, setModel] = useState<TodayModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [serverNow, setServerNow] = useState(() => new Date());

  const load = useCallback(() => {
    listDayAppointments(istDate(new Date()))
      .then((data) => {
        setServerNow(new Date(data.serverNow));
        setModel(buildTodayModel(data.appointments, data.window, data.serverNow));
        setError(null);
      })
      .catch((e) => {
        setModel(null);
        setError(
          e instanceof ApiError
            ? e.message
            : "Could not load today. Check the connection, then try again.",
        );
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useVisibleInterval(load, AUTO_REFRESH_MS);

  async function onStatus(id: string, status: AppointmentStatus, version: number) {
    setBusyId(id);
    setError(null);
    try {
      await changeAppointmentStatus(id, { status, version });
      load();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Could not update status. Check the connection, then try again.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return { model, error, busyId, serverNow, load, onStatus };
}
