import { fail, ok } from "@clinic/shared";
import { Hono } from "hono";
import {
  appointmentRescheduleChain,
  bookAppointment,
  cancelAppointment,
  changeAppointmentStatus,
  listDayAppointments,
  rescheduleAppointment,
  suggestAppointmentSlots,
  walkInAppointment,
} from "../domain/appointments";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

export const staffAppointments = new Hono<AppEnv>();

staffAppointments.get("/appointments", async (c) => {
  const { repos, ctx } = signedIn(c);
  const result = await listDayAppointments(repos, c.req.query("date"), ctx.role);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(
    ok({
      dateLocal: result.dateLocal,
      serverNow: result.serverNow,
      window: result.window,
      appointments: result.appointments,
    }),
  );
});

staffAppointments.post("/appointments", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await bookAppointment(signedIn(c).repos, body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ appointment: result.appointment }), 201);
});

staffAppointments.get("/appointments/slots", async (c) => {
  const result = await suggestAppointmentSlots(signedIn(c).repos, {
    visitTypeId: c.req.query("visitTypeId") ?? "",
    fromDate: c.req.query("date"),
    dayOnly: c.req.query("day") === "1",
  });
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ slots: result.slots }));
});

staffAppointments.post("/appointments/walk-in", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await walkInAppointment(signedIn(c).repos, body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ appointment: result.appointment }), 201);
});

staffAppointments.post("/appointments/:id/cancel", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await cancelAppointment(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ appointment: result.appointment }));
});

staffAppointments.post("/appointments/:id/reschedule", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await rescheduleAppointment(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ appointment: result.appointment, previous: result.previous }), 201);
});

staffAppointments.get("/appointments/:id/chain", async (c) => {
  const result = await appointmentRescheduleChain(signedIn(c).repos, c.req.param("id"));
  return c.json(ok({ chain: result.chain }));
});

staffAppointments.patch("/appointments/:id/status", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const result = await changeAppointmentStatus(signedIn(c).repos, c.req.param("id"), body);
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ appointment: result.appointment }));
});
