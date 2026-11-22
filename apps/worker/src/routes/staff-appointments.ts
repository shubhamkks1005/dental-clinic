import { fail, ok } from "@clinic/shared";
import { Hono } from "hono";
import {
  bookAppointment,
  changeAppointmentStatus,
  walkInAppointment,
} from "../domain/appointments";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

// POST book (2.3.4/2.3.5), PATCH status (2.3.6), POST walk-in (2.3.7).
export const staffAppointments = new Hono<AppEnv>();

staffAppointments.post("/appointments", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await bookAppointment(signedIn(c).repos, body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ appointment: result.appointment }), 201);
});

staffAppointments.post("/appointments/walk-in", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await walkInAppointment(signedIn(c).repos, body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ appointment: result.appointment }), 201);
});

staffAppointments.patch("/appointments/:id/status", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await changeAppointmentStatus(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ appointment: result.appointment }));
});
