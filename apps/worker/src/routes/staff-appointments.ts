import { fail, ok } from "@clinic/shared";
import { Hono } from "hono";
import { bookAppointment } from "../domain/appointments";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

// POST /appointments — book with overlap race (2.3.4).
export const staffAppointments = new Hono<AppEnv>();

staffAppointments.post("/appointments", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await bookAppointment(signedIn(c).repos, body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ appointment: result.appointment }), 201);
});
