import {
  APPROVAL_TYPE_LABEL,
  formatClockTime,
  istMinutes,
  type ApprovalItem,
  type CurrentBreak,
} from "@clinic/shared";
import { useCallback, useEffect, useState } from "react";
import { problemText } from "../../api/problem-text";
import { useVisibleInterval } from "../../ui/useVisibleInterval";
import { AUTO_REFRESH_MS } from "../../ui/visible-interval";
import { useToast } from "../../ui/Toast";
import { breakEndsAtMs } from "./doctor/BreakBanner";
import { listApprovals, withdrawApproval } from "./doctor/doctor-api";

const GOT_IT_KEY = "desk-asked-got-it";

function readGotIt(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(GOT_IT_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

/** T2.8: a small banner for the desk while the doctor is on a break. */
export function DoctorBreakNotice({ current }: { current: CurrentBreak | null }) {
  if (!current) return null;
  const back = formatClockTime(istMinutes(new Date(breakEndsAtMs(current))));
  return (
    <p className="notice" role="status">
      Doctor is on break, back about {back}.
    </p>
  );
}

/**
 * T2.8: "Asked the doctor": the desk's own requests with the doctor's answer. An answer stays
 * until the desk presses "Got it" (remembered in this browser). Withdraw takes back an open one.
 */
export function AskedStrip({ refreshKey }: { refreshKey: number }) {
  const toast = useToast();
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [gotIt, setGotIt] = useState<Set<string>>(readGotIt);
  const load = useCallback(() => {
    listApprovals()
      .then(setItems)
      .catch(() => undefined);
  }, []);
  useEffect(load, [load, refreshKey]);
  useVisibleInterval(load, AUTO_REFRESH_MS);

  const shown = items.filter((i) => i.status === "open" || !gotIt.has(i.id));
  if (shown.length === 0) return null;

  function acknowledge(id: string) {
    const next = new Set(gotIt).add(id);
    setGotIt(next);
    try {
      localStorage.setItem(GOT_IT_KEY, JSON.stringify([...next].slice(-100)));
    } catch {
      // Blocked storage: the line comes back on the next visit.
    }
  }
  const state = (i: ApprovalItem) =>
    i.status === "open"
      ? "Waiting for the doctor"
      : i.status === "approved"
        ? "Doctor said yes"
        : i.status === "rejected"
          ? "Doctor said no"
          : "Doctor dismissed it";

  return (
    <section className="card" aria-label="Asked the doctor">
      <h2>Asked the doctor ({shown.length})</h2>
      <ul className="asked-list">
        {shown.map((i) => (
          <li key={i.id} className="asked-row">
            <span>
              <strong>{i.patientName ?? "Patient"}</strong> · {APPROVAL_TYPE_LABEL[i.type]} ·{" "}
              <span className={i.status === "open" ? "muted" : ""}>{state(i)}</span>
              {i.answerNote ? <span className="muted"> · "{i.answerNote}"</span> : null}
            </span>
            {i.status === "open" ? (
              <button
                type="button"
                className="btn btn-compact"
                onClick={() =>
                  void withdrawApproval(i.id)
                    .then(load)
                    .catch((e: unknown) => toast({ text: problemText(e), tone: "error" }))
                }
              >
                Withdraw
              </button>
            ) : (
              <button type="button" className="btn btn-compact" onClick={() => acknowledge(i.id)}>
                Got it
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
