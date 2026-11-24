import type { Repos } from "@clinic/db";
import { adjustBreakSchema, istDate, startBreakSchema, versionBodySchema } from "@clinic/shared";

// Part T: the doctor's own break. Nothing here touches an appointment.
const firstIssue = (e: { issues: { message: string }[] }) =>
  e.issues[0]?.message ?? "Check the break.";

export async function startBreak(repos: Repos, body: unknown, now: Date = new Date()) {
  const parsed = startBreakSchema.safeParse(body);
  if (!parsed.success) return { ok: false as const, message: firstIssue(parsed.error) };
  return { ok: true as const, current: await repos.breaks.startBreak(parsed.data, now) };
}

export async function adjustBreak(repos: Repos, id: string, body: unknown, now = new Date()) {
  const parsed = adjustBreakSchema.safeParse(body);
  if (!parsed.success) return { ok: false as const, message: firstIssue(parsed.error) };
  const { deltaMinutes, version } = parsed.data;
  return {
    ok: true as const,
    current: await repos.breaks.adjustBreak(id, deltaMinutes, version, now),
  };
}

export async function endBreak(repos: Repos, id: string, body: unknown, now = new Date()) {
  const parsed = versionBodySchema.safeParse(body);
  if (!parsed.success) return { ok: false as const, message: firstIssue(parsed.error) };
  await repos.breaks.endBreak(id, parsed.data.version, now);
  return { ok: true as const };
}

export const currentBreak = (repos: Repos, now: Date = new Date()) =>
  repos.breaks.currentBreak(istDate(now));
