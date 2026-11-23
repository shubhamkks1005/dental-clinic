import { flow } from "./lib2.mjs";
const TOMORROW = new Date(Date.now() + 330 * 60_000 + 86_400_000).toISOString().slice(0, 10); // tomorrow in IST, computed, so the script works on any day
await flow({ id: process.argv[2] || "H02-messages-no-consent-no-mobile-and-reschedule", role: "receptionist", vp: "laptop" }, async (c) => {
  const p = c.page; const d = () => p.locator("dialog[open]"); const B = "http://localhost:8787";
  const mk = async (name, mob, consent, noMobile) => {
    await c.go("/app/patients/new", `Register ${name}: ${consent ? "SMS consent ticked" : "NO SMS consent"}${noMobile ? ", NO mobile" : ""}`);
    await c.type(p.getByLabel("Full name"), name, "Name"); await c.pick(p.getByLabel("Gender"), "Female", "Gender"); await c.type(p.getByLabel("Or age (years)"), "35", "Age");
    if (noMobile) { await c.click(p.getByLabel("No mobile"), "Tick No mobile"); await p.getByLabel(/Why|reason/i).first().fill("Elderly, uses family phone").catch(() => {}); } else await c.type(p.locator("input[type=tel]").first(), mob, "Mobile");
    if (consent) { await c.click(p.getByLabel("Privacy notice shown"), "Tick privacy"); await c.click(p.getByLabel("SMS reminders allowed"), "Tick SMS"); }
    await c.click(p.getByRole("button", { name: "Save patient" }), "Save patient");
    // Q1.8: a possible duplicate asks "Same person?" first; these test people are new people.
    if (await p.getByRole("button", { name: "Save as new patient" }).count()) await c.click(p.getByRole("button", { name: "Save as new patient" }), "Same person? No: save as new patient");
    c.note("Save result: " + ((await c.text()).slice(0, 110)) + " | " + (await p.locator(".error-text, [role=alert]").allInnerTexts()).join(" / "));
  };
  const book = async (nth) => { // nth free time of the day (the seed fills some slots); a different one per patient
    await c.click(p.getByRole("button", { name: "Book appointment" }).or(p.getByRole("link", { name: "Book appointment" })), "Book appointment");
    await c.pick(d().getByLabel("Visit type"), { label: "Consultation" }, "Consultation");
    await d().getByLabel("Date").fill(TOMORROW); await p.waitForTimeout(1200);
    await c.click(d().getByRole("button", { name: /^\d{1,2}:\d{2} [AP]M$/ }).nth(nth), "Pick free time number " + (nth + 1));
    await c.type(d().getByLabel(/What they said/), "msg test", "Note");
    await c.click(d().getByRole("button", { name: "Book", exact: true }), "Book");
  };
  await mk("Nocon Msgtest", "9000099060", false, false); await book(0);
  await mk("Nomob Msgtest", "", true, true);
  if (/Patient saved/.test(await c.text())) await book(3); else c.note("No-mobile patient could not be saved: stop here for this case");
  await mk("Resch Msgtest", "9000099061", true, false); await book(6);
  await p.request.get(B + "/cdn-cgi/handler/scheduled?cron=*/5+*+*+*+*"); await p.waitForTimeout(1500);
  await c.go("/app/messages", "Run the cron, then open Messages");
  const txt = await c.text(); const mine = (n) => (txt.match(new RegExp("(?:remind|confirm|reschedule|cancel) · [^|]*\\| Dear " + n + "[^|]*", "g")) || []);
  c.note("Messages for the patient WITHOUT consent: " + (mine("Nocon").length ? mine("Nocon").join(" // ") : "none created"));
  c.note("Messages for the patient WITHOUT mobile: " + (mine("Nomob").length ? mine("Nomob").join(" // ") : "none created"));
  c.note("Messages for the consenting patient: " + mine("Resch").join(" // "));
  await c.look("Messages list after the cron");
  // reschedule by drag then cron again
  await c.go(`/app/appointments?date=${TOMORROW}`, "Move Resch's appointment from 11:45 to a later time by dragging");
  const blk = p.getByRole("button", { name: /Resch Msgtest/ }).first(); const box = await blk.boundingBox();
  await p.mouse.move(box.x + 100, box.y + 8); await p.mouse.down(); await p.mouse.move(box.x + 100, box.y + 120, { steps: 10 }); await p.mouse.up();
  c.note("Drag dialog: " + (await d().innerText().catch(() => "none")).replace(/\n+/g, " | "));
  await d().getByRole("button", { name: "Move" }).click().catch(() => c.note("No Move button")); await p.waitForTimeout(1200);
  await p.request.get(B + "/cdn-cgi/handler/scheduled?cron=*/5+*+*+*+*"); await p.waitForTimeout(1500);
  await c.go("/app/messages", "Messages after the appointment was moved and the cron ran again");
  const t2 = await c.text(); const r2 = (t2.match(/(?:remind|confirm|reschedule|cancel) · [^|]*\| Dear Resch[^|]*/g) || []);
  c.note("Messages for Resch after moving the appointment: " + r2.join(" // "));
  await c.look("Messages after reschedule");
});
