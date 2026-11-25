import { formatClockTime, istMinutes, type ApprovalItem, type CurrentBreak } from "@clinic/shared";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { problemText } from "../../../api/problem-text";
import { createSubmitGuard } from "../../../ui/submit-guard";
import { useToast } from "../../../ui/Toast";
import type { DayAppointmentsReply } from "../api";
import { changeAppointmentStatus } from "../api";
import { openOrReuseVisit } from "../../visits/open-visit";
import {
  adjustBreak,
  answerApproval,
  dismissApproval,
  endBreak,
  moveAppointment,
  startBreak,
  type QueueAction,
  type QueueMove,
} from "./doctor-api";
import type { DoctorModel, DoctorRow } from "./doctor-model";
import { morphToChair } from "./morph-to-chair";
import { applyMove } from "./queue-optimistic";
import { breakEndsAtMs } from "./BreakBanner";
import { approveBillDiscount, dismissCancelRequest, rejectBillDiscount } from "../../billing";
import type { Resolve } from "./WaitingPanel";
import type { WaitingItem } from "./waiting-items";

export type ConfirmState = {
  title: string;
  subtitle: string;
  message: string;
  proceed: string;
  run: () => void;
} | null;

type Deps = {
  model: DoctorModel;
  patch: (fn: (r: DayAppointmentsReply) => DayAppointmentsReply) => void;
  load: () => void;
  hide: (key: string) => void;
};

const NO_IDS: ReadonlySet<string> = new Set();
const LIFT_MS = 170;
const SETTLE_MS = 470;

/** Everything the doctor can do on Today, with the animation and the server call for each. */
export function useDoctorActions({ model, patch, load, hide }: Deps) {
  const toast = useToast();
  const navigate = useNavigate();
  const guard = useRef(createSubmitGuard());
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [lateRow, setLateRow] = useState<DoctorRow | null>(null);
  const [liftedId, setLiftedId] = useState<string | null>(null);
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [breakBusy, setBreakBusy] = useState(false);
  const [cancelledRows, setCancelledRows] = useState<ReadonlyMap<string, DoctorRow>>(new Map());
  const [cancelRow, setCancelRow] = useState<{ row: DoctorRow; mode: "cancel" | "missed" } | null>(
    null,
  );
  const [rescheduleRow, setRescheduleRow] = useState<DoctorRow | null>(null);
  const [breakWarn, setBreakWarn] = useState<DoctorRow | null>(null);

  const fail = (e: unknown, fallback: string) =>
    toast({ text: problemText(e) || fallback, tone: "error" });
  const rowEl = (id: string) => document.querySelector<HTMLElement>(`[data-row-id="${id}"]`);

  async function openVisit(row: DoctorRow) {
    setOpeningId(row.id);
    try {
      const visitId = await openOrReuseVisit({ patientId: row.patientId, appointmentId: row.id });
      navigate(`/app/visits/${visitId}`);
    } catch (e) {
      fail(e, "Could not open the visit. Check the connection, then try again.");
    } finally {
      setOpeningId(null);
    }
  }

  /** A queue move: lift the row, apply the new order at once, tell the server, undo on failure. */
  function move(row: DoctorRow, action: QueueAction, done?: string) {
    const run = async () => {
      setLiftedId(action === "skip" || action === "pull-forward" ? row.id : null);
      const server = moveAppointment(row.id, action, row.version).catch((e: unknown) => e);
      await new Promise((r) =>
        setTimeout(r, action === "skip" || action === "pull-forward" ? LIFT_MS : 0),
      );
      patch((r) => ({ ...r, appointments: applyMove(r.appointments, action, row.id, new Date()) }));
      window.setTimeout(() => setLiftedId(null), SETTLE_MS);
      const result = await server;
      if (result instanceof Error) {
        fail(result, "Could not save the new order. The list is back as it was.");
        load();
        return;
      }
      const m = result as QueueMove;
      // Keep the screen as it is: only take the new versions, then a quiet check a little later.
      patch((r) => ({
        ...r,
        appointments: r.appointments.map((a) =>
          a.id === m.id
            ? { ...a, version: m.version, queueOrder: m.queueOrder }
            : m.other && a.id === m.other.id
              ? { ...a, version: m.other.version, queueOrder: m.other.queueOrder }
              : a,
        ),
      }));
      if (done) toast({ text: done });
      window.setTimeout(load, 1500);
    };
    void guard.current(run);
  }

  function skip(row: DoctorRow) {
    const next = model.rows.find((r, i) => i > model.rows.indexOf(row) && r.canReorder);
    setConfirm({
      title: `Skip ${row.name}?`,
      subtitle: `${row.patientCode} · ${row.timeLabel}`,
      message: next
        ? `${next.name} will move up one slot and ${row.name} will move one position down.`
        : `${row.name} will be marked as Stepped out (above Done patients).`,
      proceed: "Skip",
      run: () => move(row, "skip"),
    });
  }

  function pull(row: DoctorRow) {
    const at = model.rows.indexOf(row);
    const prev = [...model.rows.slice(0, at)].reverse().find((r) => r.canReorder);
    if (!prev) return;
    setConfirm({
      title: `Move ${row.name} up one slot?`,
      subtitle: `${row.patientCode} · ${row.timeLabel}`,
      message: `${row.name} will move one position up ahead of ${prev.name}.`,
      proceed: "Pull forward",
      run: () => move(row, "pull-forward"),
    });
  }

  function doStart(row: DoctorRow) {
    const run = async () => {
      const card = document.getElementById("td-chair");
      const el = rowEl(row.id);
      const landed = () =>
        patch((r) => ({
          ...r,
          appointments: r.appointments.map((a) =>
            a.id === row.id
              ? { ...a, status: "in_chair" as const, startedAt: new Date().toISOString() }
              : a,
          ),
        }));
      const saved = changeAppointmentStatus(row.id, {
        status: "in_chair",
        version: row.version,
      }).catch((e: unknown) => e);
      let undo = () => {};
      const reopen = () => undefined;
      if (card && el) {
        undo = morphToChair(
          el,
          card,
          { name: row.name, line: `${row.patientCode} · ${row.visit.split(" · ")[0]}` },
          { onLanded: landed, onEnd: () => undefined },
        );
      } else {
        landed();
      }
      const result = await saved;
      if (result instanceof Error) {
        undo();
        reopen();
        fail(result, "Could not start this patient. The list is back as it was.");
        load();
        return;
      }
      window.setTimeout(() => {
        reopen();
        load();
      }, 900);
    };
    void guard.current(run);
  }

  function start(row: DoctorRow) {
    if (model.currentBreak) {
      setBreakWarn(row);
      return;
    }
    startAhead(row);
  }

  function startAhead(row: DoctorRow) {
    const next = model.rows.find((r) => r.isNext);
    if (next && next.id !== row.id && row.kind !== "late") {
      setConfirm({
        title: `Start ${row.name} now?`,
        subtitle: `${row.patientCode} · ${row.timeLabel}`,
        message: `${next.name} is currently Next in queue. Are you sure you want to start ${row.name} ahead of them?`,
        proceed: "Start visit",
        run: () => doStart(row),
      });
      return;
    }
    doStart(row);
  }

  async function finishChair() {
    if (!model.chair) return;
    const chair = model.chair;
    setFinishing(true);
    patch((r) => ({
      ...r,
      appointments: r.appointments.map((a) =>
        a.id === chair.id ? { ...a, status: "completed" as const } : a,
      ),
    }));
    try {
      await changeAppointmentStatus(chair.id, { status: "completed", version: chair.version });
      window.setTimeout(load, 900);
    } catch (e) {
      fail(e, "Could not finish this visit. Check the connection, then try again.");
      load();
    } finally {
      setFinishing(false);
    }
  }

  /** Cancel (the design's cancelRow): struck through, then it moves down above the Done rows and
   * stays there, marked Cancelled, for this visit to the page. */
  function markCancelled(row: DoctorRow) {
    setCancelledRows((m0) => new Map(m0).set(row.id, row));
  }
  /** The server refused: the row goes back to where it was. */
  function undoCancelled(row: DoctorRow, message: string) {
    setCancelledRows((m0) => {
      const n = new Map(m0);
      n.delete(row.id);
      return n;
    });
    fail(new Error(message), message);
    load();
  }

  function jump(id: string) {
    setSpotlightId(id);
    rowEl(id)?.scrollIntoView({ block: "nearest" });
    window.setTimeout(() => setSpotlightId(null), 1400);
  }

  // ---- break ----
  async function takeBreak(minutes: number, label: string) {
    const pending: CurrentBreak = {
      id: "pending",
      startedAt: new Date().toISOString(),
      minutes,
      label,
      version: 0,
    };
    patch((r) => ({ ...r, currentBreak: pending }));
    try {
      const current = await startBreak(minutes, label);
      patch((r) => ({ ...r, currentBreak: current }));
    } catch (e) {
      patch((r) => ({ ...r, currentBreak: null }));
      fail(e, "Could not start the break.");
      load();
    }
  }
  async function changeBreak(b: CurrentBreak, delta: number) {
    if (b.id === "pending") return;
    setBreakBusy(true);
    patch((r) => ({ ...r, currentBreak: { ...b, minutes: b.minutes + delta } }));
    try {
      const current = await adjustBreak(b.id, delta, b.version);
      patch((r) => ({ ...r, currentBreak: current }));
    } catch (e) {
      patch((r) => ({ ...r, currentBreak: b }));
      fail(e, "Could not change the break.");
      load();
    } finally {
      setBreakBusy(false);
    }
  }
  async function backFromBreak(b: CurrentBreak) {
    if (b.id === "pending") return;
    patch((r) => ({ ...r, currentBreak: null }));
    try {
      await endBreak(b.id, b.version);
    } catch (e) {
      patch((r) => ({ ...r, currentBreak: b }));
      fail(e, "Could not end the break.");
      load();
    }
  }
  const breakBackLabel = (b: CurrentBreak) =>
    formatClockTime(istMinutes(new Date(breakEndsAtMs(b))));

  // ---- Waiting for you ----
  async function resolve(item: WaitingItem, how: Resolve, note: string) {
    try {
      if (item.approval) await answerOrDismiss(item.approval, how, note);
      else if (item.discount) {
        if (how.kind === "yes")
          await approveBillDiscount(item.discount.billId, item.discount.version);
        else await rejectBillDiscount(item.discount.billId, item.discount.version);
      } else if (item.cancel) await dismissCancelRequest(item.cancel.id);
      else window.setTimeout(() => hide(item.key), 420);
      // The line slides out first (420 ms in the design), then the list is read again.
      window.setTimeout(load, 420);
    } catch (e) {
      fail(e, "Could not save your answer.");
      load();
      throw e;
    }
  }
  const answerOrDismiss = (a: ApprovalItem, how: Resolve, note: string) =>
    how.kind === "dismiss"
      ? dismissApproval(a.id, a.version)
      : answerApproval(
          a.id,
          how.kind === "yes" ? "approve" : "reject",
          note.trim() || undefined,
          a.version,
        );

  return {
    confirm,
    setConfirm,
    lateRow,
    setLateRow,
    liftedId,
    spotlightId,
    openingId,
    finishing,
    breakBusy,
    cancelledRows,
    removingIds: NO_IDS,
    markCancelled,
    undoCancelled,
    cancelRow,
    setCancelRow,
    rescheduleRow,
    setRescheduleRow,
    breakWarn,
    setBreakWarn,
    openVisit,
    move,
    skip,
    pull,
    start,
    startAhead,
    doStart,
    finishChair,
    jump,
    takeBreak,
    changeBreak,
    backFromBreak,
    breakBackLabel,
    resolve,
  };
}
