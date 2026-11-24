import { fail, ok } from "@clinic/shared";
import { Hono } from "hono";
import { moveInQueue, type QueueMove } from "../domain/appointments-queue";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

// Part T: skip, pull forward, step out/back and "late, coming today" on the doctor's list.
export const staffAppointmentsQueue = new Hono<AppEnv>();

const MOVES: [string, QueueMove][] = [
  ["skip", "skip"],
  ["pull-forward", "pullForward"],
  ["step-out", "stepOut"],
  ["step-back", "stepBack"],
  ["late", "markLateToday"],
];

for (const [path, move] of MOVES) {
  staffAppointmentsQueue.post(`/appointments/:id/${path}`, async (c) => {
    const body = await c.req.json().catch(() => null);
    const result = await moveInQueue(signedIn(c).repos, move, c.req.param("id"), body);
    if (!result.ok) return c.json(fail("invalid", result.message), 400);
    return c.json(ok({ move: result.result }));
  });
}
