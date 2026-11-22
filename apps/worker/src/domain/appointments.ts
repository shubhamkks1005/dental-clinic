import type { Repos } from "@clinic/db";
import { parseBookAppointment, type Timings } from "@clinic/shared";

export async function bookAppointment(repos: Repos, body: unknown) {
  const parsed = parseBookAppointment(body);
  if (!parsed.ok) return parsed;
  const timings = (await repos.settings.get("clinic.timings")).value as Timings;
  const appointment = await repos.appointments.book(parsed.value, timings.slotMinutes);
  return { ok: true as const, appointment };
}
