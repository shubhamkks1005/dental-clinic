import { istDate, istMinutes, formatClockTime, type ApprovalItem } from "@clinic/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "../../../api/client";
import { refreshFailure } from "../../../ui/refresh-fail";
import { useVisibleInterval } from "../../../ui/useVisibleInterval";
import { AUTO_REFRESH_MS } from "../../../ui/visible-interval";
import {
  listCancelRequests,
  listPendingDiscounts,
  type CancelRequest,
  type PendingDiscount,
} from "../../billing";
import { listDraftPrescriptions } from "../../prescriptions";
import { listRequests } from "../../requests/api";
import { listDraftVisits } from "../../visits/api";
import { listDayAppointments, type DayAppointmentsReply } from "../api";
import { listApprovals } from "./doctor-api";
import { buildDoctorModel } from "./doctor-model";
import { buildWaitingItems } from "./waiting-items";

type Extras = {
  approvals: ApprovalItem[];
  discounts: PendingDiscount[];
  cancels: CancelRequest[];
  drafts: Awaited<ReturnType<typeof listDraftVisits>>;
  prescriptions: Awaited<ReturnType<typeof listDraftPrescriptions>>;
  requests: Awaited<ReturnType<typeof listRequests>>;
};
const NO_EXTRAS: Extras = {
  approvals: [],
  discounts: [],
  cancels: [],
  drafts: [],
  prescriptions: [],
  requests: [],
};

const HIDDEN_KEY = "doctor-today-hidden";

/** Items the doctor hid with the X: for today only (a new day shows them again). */
function readHidden(day: string): Set<string> {
  try {
    const saved = JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? "null") as {
      day: string;
      keys: string[];
    } | null;
    return new Set(saved?.day === day ? saved.keys : []);
  } catch {
    return new Set();
  }
}
function writeHidden(day: string, keys: Set<string>) {
  try {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify({ day, keys: [...keys] }));
  } catch {
    // Private window or blocked storage: the item simply comes back on the next visit.
  }
}

/**
 * One round of independent requests (speed rule 6): the day list, the desk's requests and the
 * doctor's other waiting lines. A failed refresh keeps what is on the screen (rule 8).
 */
export function useDoctorToday(canSeeRequests: boolean) {
  const [reply, setReply] = useState<DayAppointmentsReply | null>(null);
  const [extras, setExtras] = useState<Extras>(NO_EXTRAS);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(() => readHidden(istDate(new Date())));
  const seenKeys = useRef<Set<string> | null>(null);
  const [freshKeys, setFreshKeys] = useState<Set<string>>(new Set());
  const hasData = useRef(false);
  hasData.current = reply !== null;
  const day = istDate(now);

  // Counts the screen's own changes (optimistic moves). A refresh that started before the latest
  // change may carry older data from the server, so it must not overwrite what the doctor just did.
  const localChanges = useRef(0);

  const load = useCallback(() => {
    const startedAt = localChanges.current;
    const today = istDate(new Date());
    Promise.all([
      listDayAppointments(today),
      listApprovals().catch(() => []),
      listPendingDiscounts().catch(() => []),
      listCancelRequests().catch(() => []),
      listDraftVisits().catch(() => []),
      listDraftPrescriptions().catch(() => []),
      canSeeRequests ? listRequests("open").catch(() => []) : Promise.resolve([]),
    ])
      .then(([r, approvals, discounts, cancels, drafts, prescriptions, requests]) => {
        setExtras({ approvals, discounts, cancels, drafts, prescriptions, requests });
        if (localChanges.current !== startedAt) {
          // Stale for the day list: ask again shortly, once the server has caught up.
          window.setTimeout(load, 700);
          return;
        }
        setReply(r);
        setNow(new Date(r.serverNow));
        setUpdatedAt(new Date());
        setError(null);
      })
      .catch((e: unknown) => {
        const fail = refreshFailure(
          hasData.current,
          e instanceof ApiError
            ? e.message
            : "Could not load today. Check the connection, then try again.",
        );
        if (!fail.keepData) setReply(null);
        setError(fail.error);
      });
  }, [canSeeRequests]);

  useEffect(() => {
    load();
  }, [load]);
  useVisibleInterval(load, AUTO_REFRESH_MS);

  const model = useMemo(
    () =>
      reply
        ? buildDoctorModel(reply.appointments, reply.window, now, {
            lastOrderChange: reply.lastOrderChange,
            currentBreak: reply.currentBreak,
          })
        : null,
    [reply, now],
  );

  const items = useMemo(
    () =>
      buildWaitingItems({
        ...extras,
        hidden: hiddenKeys,
        exceptPatientId: undefined,
        timeOf: (iso) => formatClockTime(istMinutes(new Date(iso))),
      }),
    [extras, hiddenKeys],
  );

  // "New" chip: lines that were not there on the previous refresh (not on the first one).
  useEffect(() => {
    if (!reply) return;
    const keys = new Set(items.map((i) => i.key));
    if (seenKeys.current) {
      const prev = seenKeys.current;
      const added = [...keys].filter((k) => !prev.has(k));
      if (added.length > 0) setFreshKeys(new Set(added));
    }
    seenKeys.current = keys;
  }, [items, reply]);

  /** Change the day reply in place (the optimistic move, the break the server just confirmed). */
  const patch = useCallback((fn: (r: DayAppointmentsReply) => DayAppointmentsReply) => {
    localChanges.current += 1;
    setReply((r) => (r ? fn(r) : r));
  }, []);

  function hide(key: string) {
    setHiddenKeys((cur) => {
      const next = new Set(cur).add(key);
      writeHidden(day, next);
      return next;
    });
  }

  return { reply, model, items, freshKeys, error, updatedAt, now, load, hide, patch };
}
