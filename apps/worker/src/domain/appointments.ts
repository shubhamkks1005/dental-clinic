import type { Repos } from "@clinic/db";
import {
  dayWindow,
  istDate,
  parseBookAppointment,
  parseCancelAppointment,
  parseChangeAppointmentStatus,
  parseRescheduleAppointment,
  parseWalkInAppointment,
  type Holiday,
  type Timings,
} from "@clinic/shared";

async function clinicClock(repos: Repos) {
  const timings = (await repos.settings.get("clinic.timings")).value as Timings;
  const holidays = (await repos.settings.get("clinic.holidays")).value as Holiday[];
  return { timings, holidays };
}

export async function bookAppointment(repos: Repos, body: unknown, now: Date = new Date()) {
  const parsed = parseBookAppointment(body);
  if (!parsed.ok) return parsed;
  const { timings, holidays } = await clinicClock(repos);
  const bookAheadDays = (await repos.settings.get("appointments.book_ahead_days")).value as number;
  const appointment = await repos.appointments.book(parsed.value, {
    timings,
    holidays,
    bookAheadDays,
    now,
  });
  return { ok: true as const, appointment };
}

export async function changeAppointmentStatus(
  repos: Repos,
  id: string,
  body: unknown,
  now: Date = new Date(),
) {
  const parsed = parseChangeAppointmentStatus(body);
  if (!parsed.ok) return parsed;
  const appointment = await repos.appointments.changeStatus(id, parsed.value, now);
  return { ok: true as const, appointment };
}

export async function walkInAppointment(repos: Repos, body: unknown, now: Date = new Date()) {
  const parsed = parseWalkInAppointment(body);
  if (!parsed.ok) return parsed;
  const { timings, holidays } = await clinicClock(repos);
  const appointment = await repos.appointments.walkIn(parsed.value, { timings, holidays, now });
  return { ok: true as const, appointment };
}

export async function cancelAppointment(repos: Repos, id: string, body: unknown) {
  const parsed = parseCancelAppointment(body);
  if (!parsed.ok) return parsed;
  const appointment = await repos.appointments.cancel(id, parsed.value);
  return { ok: true as const, appointment };
}

export async function rescheduleAppointment(
  repos: Repos,
  id: string,
  body: unknown,
  now: Date = new Date(),
) {
  const parsed = parseRescheduleAppointment(body);
  if (!parsed.ok) return parsed;
  const { timings, holidays } = await clinicClock(repos);
  const bookAheadDays = (await repos.settings.get("appointments.book_ahead_days")).value as number;
  const result = await repos.appointments.reschedule(id, parsed.value, {
    timings,
    holidays,
    bookAheadDays,
    now,
  });
  return { ok: true as const, ...result };
}

export async function listPatientAppointments(repos: Repos, patientId: string) {
  const appointments = await repos.appointments.listForPatient(patientId);
  return { ok: true as const, appointments };
}

const DATE_LOCAL = /^\d{4}-\d{2}-\d{2}$/;

/** Day view payload (2.4.1): appointments + clinic window + server clock. */
export async function listDayAppointments(
  repos: Repos,
  dateRaw: string | undefined,
  now: Date = new Date(),
) {
  const dateLocal = dateRaw && dateRaw.length > 0 ? dateRaw : istDate(now);
  if (!DATE_LOCAL.test(dateLocal)) {
    return { ok: false as const, message: "Pick a date as YYYY-MM-DD." };
  }
  // listForDay asserts appointments.manage first so denied roles get 403.
  const appointments = await repos.appointments.listForDay(dateLocal);
  const { timings, holidays } = await clinicClock(repos);
  const window = dayWindow(dateLocal, timings, holidays);
  return {
    ok: true as const,
    dateLocal,
    serverNow: now.toISOString(),
    window,
    appointments,
  };
}

export async function appointmentRescheduleChain(repos: Repos, id: string) {
  const chain = await repos.appointments.rescheduleChain(id);
  return { ok: true as const, chain };
}

/** Next free slots for quick-book (2.4.2). */
export async function suggestAppointmentSlots(
  repos: Repos,
  query: { visitTypeId: string; fromDate?: string },
  now: Date = new Date(),
) {
  if (query.fromDate && !DATE_LOCAL.test(query.fromDate)) {
    return { ok: false as const, message: "Pick a date as YYYY-MM-DD." };
  }
  const { timings, holidays } = await clinicClock(repos);
  // suggestSlots asserts appointments.manage first (403 for denied roles).
  const slots = await repos.appointments.suggestSlots(query.visitTypeId, {
    timings,
    holidays,
    now,
    fromDate: query.fromDate,
    limit: 5,
  });
  return {
    ok: true as const,
    slots: slots.map((s) => ({
      dateLocal: s.dateLocal,
      startMin: s.startMin,
      endMin: s.endMin,
      startAt: s.startAt.toISOString(),
    })),
  };
}
