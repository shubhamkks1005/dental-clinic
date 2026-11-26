import { fail, ok } from "@clinic/shared";
import { Hono } from "hono";
import {
  addDoctorLeave,
  listDoctorLeaves,
  listDoctors,
  myDoctorProfile,
  patientLastVisit,
  removeDoctorLeave,
  saveMyDoctorProfile,
  searchAppointments,
} from "../domain/doctors";
import { signedIn } from "../http";
import type { AppEnv } from "../types";

// Several doctors (owner 2026-11-26).
export const staffDoctors = new Hono<AppEnv>();

const body = (c: { req: { json: () => Promise<unknown> } }) => c.req.json().catch(() => null);

staffDoctors.get("/doctors", async (c) => {
  return c.json(ok({ doctors: await listDoctors(signedIn(c).repos) }));
});

staffDoctors.get("/doctor-leaves", async (c) => {
  const result = await listDoctorLeaves(
    signedIn(c).repos,
    signedIn(c).ctx.role,
    c.req.query("from"),
    c.req.query("to"),
  );
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ leaves: result.leaves }));
});

staffDoctors.post("/doctor-leaves", async (c) => {
  const result = await addDoctorLeave(signedIn(c).repos, signedIn(c).ctx.role, await body(c));
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ id: result.id }), 201);
});

staffDoctors.post("/doctor-leaves/:id/remove", async (c) => {
  const result = await removeDoctorLeave(
    signedIn(c).repos,
    signedIn(c).ctx.role,
    c.req.param("id"),
    await body(c),
  );
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ removed: true }));
});

staffDoctors.get("/appointments/search", async (c) => {
  const result = await searchAppointments(signedIn(c).repos, signedIn(c).ctx.role, {
    q: c.req.query("q"),
    doctors: c.req.query("doctors"),
  });
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ hits: result.hits }));
});

staffDoctors.get("/patients/:id/last-visit", async (c) => {
  const last = await patientLastVisit(signedIn(c).repos, c.req.param("id"));
  return c.json(ok({ lastVisit: last }));
});

staffDoctors.get("/doctor-profile/me", async (c) => {
  return c.json(ok({ profile: await myDoctorProfile(signedIn(c).repos) }));
});

staffDoctors.put("/doctor-profile/me", async (c) => {
  const result = await saveMyDoctorProfile(signedIn(c).repos, signedIn(c).ctx.role, await body(c));
  if (!result.ok) return c.json(fail("invalid", result.message), 400);
  return c.json(ok({ profile: result.profile }));
});
