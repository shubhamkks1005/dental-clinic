import type { Repos } from "@clinic/db";
import { messagesAfterAppointmentChange, OUT_OF_DATE } from "./messages-events";
import {
  parseBookAppointment,
  parseCancelAppointment,
  parseChangeAppointmentStatus,
  parseRescheduleAppointment,
  parseVersionOnly,
  parseWalkInAppointment,
  type Holiday,
  type Timings,
} from "@clinic/shared";

export async function clinicClock(repos: Repos) {
  // One read for both (speed rule 1: the day list was at the 10-query limit).
  const both = await repos.settings.getMany(["clinic.timings", "clinic.holidays"]);
  return {
    timings: both.get("clinic.timings")?.value as Timings,
    holidays: both.get("clinic.holidays")?.value as Holiday[],
  };
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
  // Q1.5: a missed or cancelled booking must not keep a confirm or reminder in the queue.
  if (["no_show", "cancelled", "rescheduled"].includes(appointment.status)) {
    await repos.messages.cancelQueuedForAppointment(id, OUT_OF_DATE).catch(() => 0);
  }
  return { ok: true as const, appointment };
}

export async function walkInAppointment(repos: Repos, body: unknown, now: Date = new Date()) {
  const parsed = parseWalkInAppointment(body);
  if (!parsed.ok) return parsed;
  const { timings, holidays } = await clinicClock(repos);
  const appointment = await repos.appointments.walkIn(parsed.value, { timings, holidays, now });
  return { ok: true as const, appointment };
}

export async function cancelAppointment(
  repos: Repos,
  id: string,
  body: unknown,
  messagingMode?: string,
) {
  const parsed = parseCancelAppointment(body);
  if (!parsed.ok) return parsed;
  const appointment = await repos.appointments.cancel(id, parsed.value);
  // Q1.5: queued messages for it are out of date; the patient gets one "cancelled" message.
  const row = await repos.messagesPlan.getAppointment(id);
  if (row) {
    await messagesAfterAppointmentChange(
      repos,
      { kind: "cancel", appt: row },
      messagingMode ?? "dry_run",
    );
  }
  return { ok: true as const, appointment };
}

/** PA-M06: put a just-cancelled appointment back; its queued "cancelled" message is dropped. */
export async function undoCancelAppointment(repos: Repos, id: string, body: unknown) {
  const parsed = parseVersionOnly(body);
  if (!parsed.ok) return parsed;
  const appointment = await repos.appointments.undoCancel(id, parsed.value.version);
  try {
    await repos.messages.cancelQueuedForAppointment(id, OUT_OF_DATE);
  } catch {
    /* the outbox board shows what was queued; the booking is already back */
  }
  return { ok: true as const, appointment };
}

export async function rescheduleAppointment(
  repos: Repos,
  id: string,
  body: unknown,
  now: Date = new Date(),
  messagingMode?: string,
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
  // Q1.5: old queued messages are out of date; one "moved" message for the new time.
  await messagesAfterAppointmentChange(
    repos,
    { kind: "move", oldId: id, appt: result.appointment },
    messagingMode ?? "dry_run",
    now,
  );
  return { ok: true as const, ...result };
}

export async function listPatientAppointments(repos: Repos, patientId: string) {
  const appointments = await repos.appointments.listForPatient(patientId);
  return { ok: true as const, appointments };
}

const DATE_LOCAL = /^\d{4}-\d{2}-\d{2}$/;

// The day list and the week range live in appointments-list.ts.

export async function appointmentRescheduleChain(repos: Repos, id: string) {
  const chain = await repos.appointments.rescheduleChain(id);
  return { ok: true as const, chain };
}

/** Next free slots for quick-book (2.4.2). */
export async function suggestAppointmentSlots(
  repos: Repos,
  query: { visitTypeId: string; fromDate?: string; dayOnly?: boolean },
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
    // dayOnly: every free time of that one day (the desk picks the exact time).
    limit: query.dayOnly ? 60 : 5,
    searchDays: query.dayOnly ? 1 : undefined,
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
