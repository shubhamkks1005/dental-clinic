import type { Repos } from "@clinic/db";
import {
  parseBookAppointment,
  parseChangeAppointmentStatus,
  type Holiday,
  type Timings,
} from "@clinic/shared";

export async function bookAppointment(repos: Repos, body: unknown, now: Date = new Date()) {
  const parsed = parseBookAppointment(body);
  if (!parsed.ok) return parsed;
  const timings = (await repos.settings.get("clinic.timings")).value as Timings;
  const holidays = (await repos.settings.get("clinic.holidays")).value as Holiday[];
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
