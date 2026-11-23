import { flow } from "./lib2.mjs";
await flow({ id: process.argv[2] || "E01-settings-timings-visit-type-medicine", role: "doctor", vp: "laptop" }, async (c) => {
  const p = c.page; const d = () => p.locator("dialog[open]");
  const msg = async () => (await p.locator(".error-text, [role=alert], [role=status], .toast").allInnerTexts()).join(" / ").slice(0, 300);
  // ---- Timings ----
  await c.go("/app/settings/timings", "PART 1: the doctor wants the clinic open late today (Monday) to see how timings change booking");
  await c.look("Timings screen");
  const save = p.getByRole("button", { name: /^Save/ });
  c.note("Save button state before any change: " + ((await save.count()) ? (await save.first().isEnabled() ? "enabled" : "disabled") : "no Save button"));
  await p.locator('input[name="week.mon.end"]').fill("23:30"); await c.look("Monday closing time changed to 23:30");
  await c.click(save, "Click Save");
  c.note("After save: " + (await msg()));
  await c.look("After saving timings");
  await p.locator('input[name="week.mon.end"]').fill("07:00");
  await c.click(save, "EDGE: set Monday closing 07:00 (before opening 10:00) and Save");
  await p.waitForTimeout(6500);
  c.note("6 seconds after pressing Save with closing before opening: messages on screen = [" + (await msg()) + "]");
  await c.look("Still no message");
  await p.reload(); await p.waitForTimeout(1200);
  c.note("After reloading the page the Monday closing time is " + (await p.locator('input[name="week.mon.end"]').inputValue()) + " (the 07:00 was not saved)");
  // ---- Effect for the receptionist ----
  await c.as("receptionist", "Switch to the receptionist");
  await c.go("/app/appointments", "Appointments");
  await c.click(p.getByRole("button", { name: "Book", exact: true }), "Open Book dialog (today)");
  await c.type(d().getByLabel("Patient"), "Neha", "Type a patient name"); await p.waitForTimeout(900);
  await c.click(d().locator("button.quick-book-result"), "Pick the patient");
  await c.pick(d().getByLabel("Visit type"), { label: "Consultation" }, "Choose Consultation");
  await c.look("Free times today now that the clinic is open until 23:30");
  c.note("Times offered today: " + ((await d().innerText()).match(/\d+:\d\d [AP]M/g) || []).slice(0, 8).join(", ") + " ...");
  await p.keyboard.press("Escape");
  // ---- Visit type ----
  await c.as("doctor", "Back to the doctor");
  await c.go("/app/settings/visit_types", "PART 2: add a new visit type");
  await c.look("Visit types list and add form");
  await c.type(p.locator('input[name="label"]'), "Retainer check", "Type the name 'Retainer check'");
  await c.type(p.locator('input[name="data.minutes"]'), "20", "Duration 20 minutes (slot grid is every 15 minutes)");
  await c.click(p.getByRole("button", { name: "Add", exact: true }), "Click Add");
  c.note("After add: " + (await msg()));
  await c.look("After adding the visit type");
  // ---- Medicine ----
  await c.go("/app/settings/medicines", "PART 3: add a medicine to the doctor's own list");
  await c.look("Medicines list");
  c.note("Add form fields: " + (await p.locator("main form input, main form select, main form textarea").evaluateAll(e=>e.map(x=>x.name||x.placeholder||x.type)).catch(()=>[])).join(", "));

  await c.type(p.locator('input[name="label"]'), "Ibuprofen", "Type the medicine name 'Ibuprofen'");
  await c.type(p.locator('input[name="data.strength"]'), "400 mg", "Type strength 400 mg");
  await c.click(p.getByRole("button", { name: "Add", exact: true }), "Click Add");
  c.note("After add medicine: " + (await msg()));
  await c.look("After adding the medicine");
  // ---- Do the new settings reach the screens that use them? ----
  await c.as("receptionist", "PART 4: do the new settings appear where they are used? Receptionist opens Book");
  await c.go("/app/appointments", "Appointments");
  await c.click(p.getByRole("button", { name: "Book", exact: true }), "Open Book");
  await c.type(d().getByLabel("Patient"), "Neha", "Patient"); await p.waitForTimeout(900);
  await c.click(d().locator("button.quick-book-result"), "Pick the patient");
  c.note("Visit types offered: " + (await d().getByLabel("Visit type").locator("option").allInnerTexts()).join(", "));
  await c.pick(d().getByLabel("Visit type"), { label: "Retainer check" }, "Choose the new visit type 'Retainer check' (20 minutes)");
  await c.look("Free times for a 20-minute visit type");
  c.note("Times offered for the 20-minute type: " + ((await d().innerText()).match(/\d+:\d\d [AP]M/g) || []).slice(0, 8).join(", "));
  await p.keyboard.press("Escape");
  await c.as("doctor", "Doctor: does the new medicine appear in a visit?");
  await c.go("/app", "Doctor Today");
  await c.click(p.getByRole("button", { name: "Open visit" }).or(p.getByRole("link", { name: "Open visit" })).first(), "Open a visit");
  await c.click(p.getByRole("tab", { name: "Medicines", exact: true }), "Medicines tab");
  await c.type(p.getByPlaceholder(/Search medicine/), "Ibu", "Search 'Ibu'");
  await c.look("Is Ibuprofen found?");
  c.note("Ibuprofen found in the visit's search: " + /Ibuprofen/.test(await c.text()));
});
