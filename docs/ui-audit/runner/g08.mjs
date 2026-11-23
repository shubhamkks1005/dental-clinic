import { flow } from "./lib2.mjs";
await flow({ id: process.argv[2] || "G08-child-with-guardian-and-shared-mobile", role: "receptionist", vp: "laptop" }, async (c) => {
  const p = c.page; const d = () => p.locator("dialog[open]"); const B = "http://localhost:8787";
  await c.go("/app/patients/new", "A mother brings her 8-year-old son. The boy has no phone; the mother's phone is the contact");
  await c.type(p.getByLabel("Full name"), "Kiddo Guardtest", "Child's name"); await c.pick(p.getByLabel("Gender"), "Male", "Gender"); await c.type(p.getByLabel("Or age (years)"), "8", "Age 8");
  await c.click(p.getByLabel("No mobile"), "Tick No mobile (the child has none)");
  await c.type(p.getByLabel("Why no mobile"), "Child has no phone", "Type why there is no mobile");
  c.note("After ticking No mobile: fields visible = " + (await p.locator("main input:visible, main select:visible").evaluateAll(e => e.map(x => (x.labels && x.labels[0] ? x.labels[0].innerText.trim().slice(0, 28) : x.name || x.type)))).join(" | "));
  await c.click(p.getByRole("button", { name: "More details" }), "Open More details (guardian fields)");
  await c.look("More details opened");
  c.note("More details fields: " + (await p.locator("main input:visible, main select:visible, main textarea:visible").evaluateAll(e => e.map(x => (x.labels && x.labels[0] ? x.labels[0].innerText.trim().slice(0, 30) : x.name || x.type)))).join(" | "));
  await p.getByLabel("Guardian name").fill("Sunita Guardtest");
  await p.getByLabel("Guardian relation").fill("Mother").catch(() => {});
  await p.getByLabel("Guardian mobile").locator("xpath=..").locator("input[type=tel]").first().fill("9000099070").catch(async () => { await p.locator("input[type=tel]").nth(2).fill("9000099070"); });
  await c.pick(p.getByLabel("Whose contact mobile"), { label: "Mother" }, "Contact mobile belongs to: Mother").catch(() => c.note("Could not pick contact owner"));
  await c.click(p.getByLabel("Privacy notice shown"), "Tick Privacy notice shown"); await c.click(p.getByLabel("SMS reminders allowed"), "Tick SMS reminders allowed");
  await c.look("Child form filled with guardian");
  await c.click(p.getByRole("button", { name: "Save patient" }), "Save patient");
  c.note("Save result: " + (await c.text()).slice(0, 120) + " | " + (await p.locator(".error-text, [role=alert]").allInnerTexts()).join(" / "));
  // book
  await c.click(p.getByRole("button", { name: "Book appointment" }).or(p.getByRole("link", { name: "Book appointment" })), "Book appointment");
  await c.pick(d().getByLabel("Visit type"), { label: "Consultation" }, "Consultation");
  await d().getByLabel("Date").fill("2026-11-24"); await p.waitForTimeout(1200);
  await c.click(d().getByRole("button", { name: "12:15 PM", exact: true }), "Pick 12:15 PM");
  await c.type(d().getByLabel(/What they said/), "child checkup", "Note");
  await c.click(d().getByRole("button", { name: "Book", exact: true }), "Book");
  await p.request.get(B + "/cdn-cgi/handler/scheduled?cron=*/5+*+*+*+*"); await p.waitForTimeout(1500);
  await c.go("/app/messages", "Run the cron and open Messages");
  // Q1.5: the message goes to the guardian ("Dear Sunita ... Kiddo's appointment"). Before its due time
  // (quiet hours 21:00 to 08:00) it waits under Scheduled and has no Open WhatsApp button yet.
  const card = p.getByText(/Kiddo's appointment/).first().locator("xpath=ancestor::li[1]");
  c.note("Message for the child: " + ((await card.innerText().catch(() => "none")).replace(/\n+/g, " | ").slice(0, 300)));
  const open = card.getByRole("button", { name: "Open WhatsApp" });
  if (await open.count()) {
    const popP = ctxWait(p);
    await c.click(open, "Click Open WhatsApp on the child's message");
    const pop = await popP; c.note("WhatsApp opens for number/text: " + (pop ? decodeURIComponent(pop.url()).replace(/\+/g, " ").slice(0, 260) : "no tab opened"));
  } else c.note("No Open WhatsApp yet: the message is scheduled until its due time (hidden until due)");
  // profile
  await c.go("/app/patients", "Open the child's profile to see how the contact is shown"); await c.click(p.getByRole("link", { name: "Kiddo Guardtest" }).first(), "Open Kiddo");
  await c.look("Profile of a child with guardian");
  c.note("Profile header: " + (await c.text()).slice(0, 220));
});
function ctxWait(p) { return p.context().waitForEvent("page", { timeout: 6000 }).catch(() => null); }
