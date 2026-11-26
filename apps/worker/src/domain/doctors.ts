import { ForbiddenError, isAllowed, type Action, type Repos } from "@clinic/db";
import {
  type Role,
  addIstDays,
  appointmentSearchQuerySchema,
  daysBetweenOn,
  doctorLeaveSchema,
  istDate,
  saveDoctorProfileSchema,
  versionBodySchema,
} from "@clinic/shared";

// Several doctors (owner 2026-11-26): the doctor list, leave days, the calendar search and each
// doctor's own letterhead. Routes only parse and reply; the rules live in the repos.
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const LEAVE_LIST_MAX_DAYS = 400;
const firstIssue = (e: { issues: { message: string }[] }, fallback: string) =>
  e.issues[0]?.message ?? fallback;

/** Permission before the body check: a denied role gets 403, never a 400 hint. */
function mustBe(role: Role, action: Action) {
  if (!isAllowed(role, action)) throw new ForbiddenError();
}

export const listDoctors = (repos: Repos) => repos.doctors.listActive();

/** Leave days from..to (default: today and the next 90 days). */
export async function listDoctorLeaves(
  repos: Repos,
  role: Role,
  fromRaw: string | undefined,
  toRaw: string | undefined,
  now: Date = new Date(),
) {
  mustBe(role, "appointments.manage");
  const from = fromRaw || istDate(now);
  const to = toRaw || addIstDays(from, 90);
  const real = (d: string) => DATE.test(d) && addIstDays(d, 0) === d;
  if (!real(from) || !real(to))
    return { ok: false as const, message: "Pick the dates as YYYY-MM-DD." };
  const span = daysBetweenOn(from, to);
  if (span < 0 || span > LEAVE_LIST_MAX_DAYS) {
    return { ok: false as const, message: `Pick at most ${LEAVE_LIST_MAX_DAYS} days.` };
  }
  return { ok: true as const, leaves: await repos.doctorLeaves.list(from, to) };
}

export async function addDoctorLeave(repos: Repos, role: Role, body: unknown) {
  mustBe(role, "breaks.manage");
  const parsed = doctorLeaveSchema.safeParse(body);
  if (!parsed.success)
    return { ok: false as const, message: firstIssue(parsed.error, "Check the leave day.") };
  return { ok: true as const, ...(await repos.doctorLeaves.add(parsed.data)) };
}

export async function removeDoctorLeave(repos: Repos, role: Role, id: string, body: unknown) {
  mustBe(role, "breaks.manage");
  const parsed = versionBodySchema.safeParse(body);
  if (!parsed.success) return { ok: false as const, message: "Reload and try again." };
  await repos.doctorLeaves.remove(id, parsed.data.version);
  return { ok: true as const };
}

export async function searchAppointments(
  repos: Repos,
  role: Role,
  query: { q?: string; doctors?: string },
  now: Date = new Date(),
) {
  mustBe(role, "appointments.manage");
  const parsed = appointmentSearchQuerySchema.safeParse(query);
  if (!parsed.success)
    return {
      ok: false as const,
      message: firstIssue(parsed.error, "Type a name, code or mobile."),
    };
  const hits = await repos.appointmentSearch.searchUpcoming(
    parsed.data.q,
    parsed.data.doctors,
    istDate(now),
  );
  return { ok: true as const, hits };
}

export const myDoctorProfile = (repos: Repos) => repos.doctorProfiles.getMine();

export async function saveMyDoctorProfile(repos: Repos, role: Role, body: unknown) {
  mustBe(role, "prescriptions.write");
  const parsed = saveDoctorProfileSchema.safeParse(body);
  if (!parsed.success)
    return { ok: false as const, message: firstIssue(parsed.error, "Check the details.") };
  const { version, ...fields } = parsed.data;
  return { ok: true as const, profile: await repos.doctorProfiles.saveMine(fields, version) };
}

export const patientLastVisit = (repos: Repos, patientId: string) =>
  repos.lastVisit.lastVisit(patientId);
