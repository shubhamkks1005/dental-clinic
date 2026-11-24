import type { Repos } from "@clinic/db";
import { versionBodySchema } from "@clinic/shared";

// Part T: the doctor's list moves. The repo does the work in one batch; this only reads the body.
export type QueueMove = "skip" | "pullForward" | "stepOut" | "stepBack" | "markLateToday";

export async function moveInQueue(
  repos: Repos,
  move: QueueMove,
  id: string,
  body: unknown,
  now: Date = new Date(),
) {
  const parsed = versionBodySchema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "Reload and try again.",
    };
  }
  const result = await repos.appointments[move](id, parsed.data.version, now);
  return { ok: true as const, result };
}
