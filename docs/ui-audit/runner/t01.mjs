import { flow } from "./lib2.mjs";
// T2.12: the doctor's Today (PLAN Part T, docs/design/final/doctor_today.html) at laptop, tablet and phone.
// Usage: node t01.mjs T01-doctor-today laptop|tablet|phone  (needs a seeded scratch database: reset.sh)
const vp = process.argv[3] || "laptop";
await flow({ id: process.argv[2] || "T01-doctor-today", role: "doctor", vp }, async (c) => {
  const p = c.page;
  await c.go("/app", "Doctor Today"); await c.m("Doctor Today");
  await c.click(p.getByRole("button", { name: /Take a break/ }), "Take a break menu"); await c.look("Break menu");
  await c.click(p.getByRole("menuitem", { name: /10 min/ }), "Start a 10 minute break"); await c.m("Break mode");
  await c.click(p.getByRole("button", { name: "+5 min" }), "+5 min");
  await c.click(p.getByRole("button", { name: "-5 min" }), "-5 min");
  await c.click(p.getByRole("button", { name: "I'm back" }), "I'm back"); await c.m("After the break");
  const more = p.getByRole("button", { name: /More actions/ }).first();
  await c.click(more, "Row menu"); await c.look("Row actions menu");
  await c.click(p.getByRole("menuitem", { name: /Skip/ }), "Skip"); await c.look("Skip confirm");
  await c.click(p.getByRole("alertdialog").getByRole("button", { name: "Skip", exact: true }), "Confirm skip"); await c.m("After Skip");
  await c.as("receptionist", "Switch to the desk"); await c.m("Desk Today with Ask the doctor");
});
