import { ForbiddenError, isAllowed, type Repos } from "@clinic/db";
import {
  addIstDays,
  APPOINTMENT_RANGE_MAX_DAYS,
  dayWindow,
  daysBetweenOn,
  istDate,
  type AppointmentDayReply,
  type CurrentBreak,
  type DayLeave,
  type Role,
} from "@clinic/shared";
import { clinicClock } from "./appointments";
import { loadQueueExtras } from "./appointments-queue-extras";

const DATE_LOCAL = /^\d{4}-\d{2}-\d{2}$/;

type DayRows = Awaited<ReturnType<Repos["appointments"]["listForDay"]>>;
type Flags = { hasAlert: boolean; hasRestricted: boolean };
type Ready = Map<string, { visitId: string; billId: string | null }>;
type RxToPrint = Map<string, { prescriptionId: string; rxNo: string | null }>;

/**
 * The extra marks for a list of appointments, all read at the same time (S3.2.1).
 * Flags: icon only (3.3.2). Dues: a failed read means no mark (5.3.4). Ready-to-bill: desk only
 * because it is about money (Q1.2); a failed read means no mark.
 */
async function loadMarks(repos: Repos, rows: DayRows, role: Role) {
  const patientIds = [...new Set(rows.map((a) => a.patientId))];
  const empty = { ready: new Map() as Ready, rxToPrint: new Map() as RxToPrint };
  const [flags, dues, desk] = await Promise.all([
    repos.medicalHistory.alertFlagsForPatients(patientIds),
    repos.bills.duesForPatients(patientIds).catch(() => new Map<string, number>()),
    // Ready to bill and (visit finished, owner 2026-11-27) the prescription to print: one read.
    role === "receptionist"
      ? repos.bills.deskMarks(rows.map((a) => a.id)).catch(() => empty)
      : Promise.resolve(empty),
  ]);
  return { flags, dues, ready: desk.ready, rxToPrint: desk.rxToPrint };
}

function withMarks(rows: DayRows, marks: Awaited<ReturnType<typeof loadMarks>>, role: Role) {
  // 5.3.4: due mark on cards; the amount only for the receptionist.
  const showDueAmount = role === "receptionist";
  const none: Flags = { hasAlert: false, hasRestricted: false };
  return rows.map((a) => {
    const duePaise = marks.dues.get(a.patientId) ?? 0;
    const ready = marks.ready.get(a.id);
    return {
      ...a,
      // The user id of who moved the row stays on the server (JSON leaves out undefined).
      queueChangedBy: undefined,
      alertFlags: marks.flags.get(a.patientId) ?? none,
      hasDue: duePaise > 0,
      readyToBill: ready ? { billId: ready.billId } : null,
      rxToPrint: rxOf(marks.rxToPrint.get(a.id)),
      duePaise: showDueAmount && duePaise > 0 ? duePaise : null,
    };
  });
}

const rxOf = (r: { prescriptionId: string; rxNo: string | null } | undefined) =>
  r ? { prescriptionId: r.prescriptionId, rxNo: r.rxNo } : null;

export type DayAppointmentView = ReturnType<typeof withMarks>[number];

/**
 * "Dr X on leave" per day for the whole range, and the breaks on now when today is shown: one
 * round trip. A doctor sees only their own leave. A failed read means no leave lines, no break.
 */
async function loadDoctorDays(
  repos: Repos,
  from: string,
  to: string,
  today: string | null,
  role: Role,
  userId: string,
) {
  const got = await repos.doctorLeaves
    .withOpenBreaks(from, to, today)
    .catch(() => ({ leaves: new Map<string, DayLeave[]>(), openBreaks: [] as CurrentBreak[] }));
  if (role === "doctor") {
    for (const [day, list] of got.leaves) {
      got.leaves.set(
        day,
        list.filter((l) => l.doctorId === userId),
      );
    }
  }
  return got;
}

/** Day view payload (2.4.1): appointments + clinic window + server clock. */
export async function listDayAppointments(
  repos: Repos,
  dateRaw: string | undefined,
  role: Role,
  now: Date = new Date(),
  userId = "",
) {
  const dateLocal = dateRaw && dateRaw.length > 0 ? dateRaw : istDate(now);
  if (!DATE_LOCAL.test(dateLocal)) {
    return { ok: false as const, message: "Pick a date as YYYY-MM-DD." };
  }
  // listForDay asserts appointments.manage first so denied roles get 403.
  const rows = await repos.appointments.listForDay(dateLocal);
  const isToday = dateLocal === istDate(now);
  const doctorDays = loadDoctorDays(
    repos,
    dateLocal,
    dateLocal,
    isToday ? dateLocal : null,
    role,
    userId,
  );
  const [marks, { timings, holidays }, extras, { leaves }] = await Promise.all([
    loadMarks(repos, rows, role),
    clinicClock(repos),
    doctorDays.then((d) => loadQueueExtras(repos, rows, d.openBreaks)),
    doctorDays,
  ]);
  return {
    ok: true as const,
    dateLocal,
    serverNow: now.toISOString(),
    window: dayWindow(dateLocal, timings, holidays),
    appointments: withMarks(rows, marks, role),
    ...extras,
    leaves: leaves.get(dateLocal) ?? [],
  };
}

function rangeProblem(from: string, to: string): string | null {
  const real = (d: string) => DATE_LOCAL.test(d) && addIstDays(d, 0) === d;
  if (!real(from) || !real(to)) return "Pick the dates as YYYY-MM-DD.";
  const span = daysBetweenOn(from, to);
  if (span < 0) return "The end date must not be before the start date.";
  if (span >= APPOINTMENT_RANGE_MAX_DAYS) {
    return `Pick at most ${APPOINTMENT_RANGE_MAX_DAYS} days at a time.`;
  }
  return null;
}

/**
 * S3.2.2: the week view's days in one go. One appointments query, then the marks once for the
 * whole range. Every day has the same shape as the day view reply, so the screen does not change.
 */
export async function listRangeAppointments(
  repos: Repos,
  from: string,
  to: string,
  role: Role,
  now: Date = new Date(),
  userId = "",
) {
  const problem = rangeProblem(from, to);
  if (problem) {
    // Permission first: a denied role gets 403 even with bad dates, never a 400 hint.
    if (!isAllowed(role, "appointments.manage")) throw new ForbiddenError();
    return { ok: false as const, message: problem };
  }
  const rows = await repos.appointments.listForRange(from, to);
  const today = istDate(now);
  const inRange = today >= from && today <= to;
  const doctorDays = loadDoctorDays(repos, from, to, inRange ? today : null, role, userId);
  const [marks, { timings, holidays }, todayExtras, { leaves }] = await Promise.all([
    loadMarks(repos, rows, role),
    clinicClock(repos),
    inRange
      ? doctorDays.then((d) =>
          loadQueueExtras(
            repos,
            rows.filter((a) => a.dateLocal === today),
            d.openBreaks,
          ),
        )
      : Promise.resolve(null),
    doctorDays,
  ]);
  const marked = withMarks(rows, marks, role);
  const serverNow = now.toISOString();
  const days: AppointmentDayReply<DayAppointmentView>[] = [];
  for (let d = from; d <= to; d = addIstDays(d, 1)) {
    days.push({
      dateLocal: d,
      serverNow,
      window: dayWindow(d, timings, holidays),
      appointments: marked.filter((a) => a.dateLocal === d),
      lastOrderChange: d === today ? (todayExtras?.lastOrderChange ?? null) : null,
      currentBreak: d === today ? (todayExtras?.currentBreak ?? null) : null,
      openBreaks: d === today ? (todayExtras?.openBreaks ?? []) : [],
      leaves: leaves.get(d) ?? [],
    });
  }
  return { ok: true as const, days };
}
