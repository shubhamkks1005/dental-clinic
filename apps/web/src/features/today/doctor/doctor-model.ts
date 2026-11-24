import {
  expectedStarts,
  formatClockTime,
  formatDuration,
  istMinutes,
  orderDayQueue,
  runningLateMinutes,
  waitingMinutes,
  type AppointmentPriority,
  type AppointmentStatus,
  type CurrentBreak,
  type DayWindow,
  type LastOrderChange,
} from "@clinic/shared";
import type { DayAppointment } from "../../appointments/api";

// Part T: the doctor's Today, built from the day reply with the shared queue rules, so the screen,
// the server and the tests agree on the order, "Next", "Exp" and the late chip.
export type RowKind = "waiting" | "not_arrived" | "stepped_out" | "late" | "done";

export type DoctorRow = {
  id: string;
  patientId: string;
  version: number;
  name: string;
  patientCode: string;
  status: AppointmentStatus;
  priority: AppointmentPriority;
  startMin: number;
  timeLabel: string;
  /** "Braces fitting · Bringing X-ray report": visit type, then the booking note. */
  visit: string;
  alert: string | null;
  kind: RowKind;
  /** Pill text: "Waiting 12 min", "Not arrived", "Stepped out", "Late", "Done". */
  pill: string;
  isNext: boolean;
  /** "Exp 11:20" when the expected start is 5 or more minutes from the booked time. */
  exp: string | null;
  visitTypeId: string;
  startAt: string;
  updatedAt: string;
  canReorder: boolean;
};

export type DoctorModel = {
  chair: (DoctorRow & { sinceLabel: string }) | null;
  /** The list under the chair card, in the doctor's order, done rows last. */
  rows: DoctorRow[];
  waiting: number;
  notArrived: number;
  done: number;
  total: number;
  /** Minutes the first patient will start after the booked time; 0 when not over the limit. */
  lateMinutes: number;
  lunch: { startMin: number; endMin: number } | null;
  /** Index in `rows` where the lunch divider sits (rows before it are "before lunch"), or null. */
  lunchAt: number | null;
  lastOrderChange: LastOrderChange | null;
  currentBreak: CurrentBreak | null;
};

const EXP_GAP_MINUTES = 5;

/** The gap between the two working blocks of the day (lunch), from the day window. */
export function lunchOf(window: DayWindow): { startMin: number; endMin: number } | null {
  const [a, b] = window.intervals;
  return a && b && b[0] > a[1] ? { startMin: a[1], endMin: b[0] } : null;
}

function rowOf(a: DayAppointment, now: Date): Omit<DoctorRow, "isNext" | "exp"> {
  const arrived = a.status === "arrived";
  const waited = waitingMinutes(a.arrivedAt, now);
  let kind: RowKind;
  let pill: string;
  if (a.status === "completed") {
    kind = "done";
    pill = "Done";
  } else if (a.steppedOutAt) {
    kind = "stepped_out";
    pill = "Stepped out";
  } else if (a.lateAt) {
    kind = "late";
    pill = "Late";
  } else if (arrived) {
    kind = "waiting";
    pill = waited === null || waited < 1 ? "Waiting" : `Waiting ${formatDuration(waited)}`;
  } else {
    kind = "not_arrived";
    pill = "Not arrived";
  }
  return {
    id: a.id,
    patientId: a.patientId,
    version: a.version,
    name: a.patientName,
    patientCode: a.patientCode,
    status: a.status,
    priority: a.priority,
    startMin: a.startMin,
    timeLabel: formatClockTime(a.startMin),
    visit: a.complaint ? `${a.visitTypeLabel} · ${a.complaint}` : a.visitTypeLabel,
    alert: a.alertFlags?.hasAlert ? "Medical alert" : null,
    kind,
    pill,
    visitTypeId: a.visitTypeId,
    startAt: a.startAt,
    updatedAt: a.updatedAt,
    canReorder: a.status === "scheduled" || a.status === "confirmed" || a.status === "arrived",
  };
}

export function buildDoctorModel(
  appointments: readonly DayAppointment[],
  window: DayWindow,
  now: Date,
  extras: {
    lastOrderChange?: LastOrderChange | null;
    currentBreak?: CurrentBreak | null;
    lateLimitMinutes?: number;
  } = {},
): DoctorModel {
  const ordered = orderDayQueue(
    appointments.map((a) => ({ ...a, queueOrder: a.queueOrder ?? null })),
  );
  const expected = expectedStarts({
    ordered: ordered.map((a) => ({
      id: a.id,
      status: a.status,
      startMin: a.startMin,
      endMin: a.endMin,
      steppedOutAt: a.steppedOutAt ?? null,
      startedAt: a.startedAt,
    })),
    now,
  });
  const built = ordered.map((a) => ({ a, row: rowOf(a, now) }));
  const nextAt = built.findIndex(
    ({ row }) => row.status === "arrived" && row.kind !== "stepped_out",
  );
  const rows: DoctorRow[] = built.map(({ a, row }, i) => {
    const exp = expected.get(a.id);
    const showExp = exp !== undefined && Math.abs(exp - a.startMin) >= EXP_GAP_MINUTES;
    return { ...row, isNext: i === nextAt, exp: showExp ? `Exp ${formatClockTime(exp)}` : null };
  });
  const chairRow = rows.find((r) => r.status === "in_chair") ?? null;
  const chairSource = ordered.find((a) => a.status === "in_chair");
  const chair = chairRow
    ? {
        ...chairRow,
        sinceLabel: chairSource?.startedAt
          ? formatClockTime(istMinutes(new Date(chairSource.startedAt)))
          : "just now",
      }
    : null;
  const list = rows.filter((r) => r.status !== "in_chair");
  const next = list.find((r) => r.isNext) ?? null;
  const lunch = lunchOf(window);
  // The divider goes before the first still-open row that is booked after the lunch starts.
  const open = list.filter((r) => r.kind !== "done");
  let lunchAt: number | null = null;
  if (lunch && list.length > 0) {
    const after = open.findIndex((r) => r.startMin >= lunch.startMin);
    lunchAt = after === -1 ? open.length : after;
  }
  return {
    chair,
    rows: list,
    waiting: list.filter((r) => r.kind === "waiting" || r.kind === "late").length,
    notArrived: list.filter((r) => r.kind === "not_arrived" || r.kind === "stepped_out").length,
    done: list.filter((r) => r.kind === "done").length,
    total: list.length + (chair ? 1 : 0),
    lateMinutes: runningLateMinutes({
      next: next ? { id: next.id, startMin: next.startMin } : null,
      expected,
      limitMinutes: extras.lateLimitMinutes,
    }),
    lunch,
    lunchAt,
    lastOrderChange: extras.lastOrderChange ?? null,
    currentBreak: extras.currentBreak ?? null,
  };
}
