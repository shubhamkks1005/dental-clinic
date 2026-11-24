import { flow } from "./lib2.mjs";
const TOMORROW = new Date(Date.now() + 330 * 60_000 + 86_400_000).toISOString().slice(0, 10); // tomorrow in IST, computed, so the script works on any day
await flow({ id: process.argv[2] || "H01-booking-confirm-and-reminder-messages", role: "receptionist", vp: "laptop" }, async (c) => {
  const p = c.page; const d = () => p.locator("dialog[open]");
  await c.go("/app/patients/new", "Receptionist registers a patient WITH sms consent");
  await c.type(p.getByLabel("Full name"), "Mina Msgtest", "Type the name");
  await c.click(p.getByLabel("Female", { exact: true }), "Gender");
  await c.type(p.getByLabel("Or age (years)"), "31", "Age");
  await c.type(p.locator("input[type=tel]").first(), "9000099010", "Mobile");
  await c.click(p.getByLabel("Privacy notice given"), "Tick Privacy notice given");
  await c.click(p.getByLabel("Allow reminders"), "Tick Allow reminders");
  await c.click(p.getByRole("button", { name: "Save patient" }), "Save patient");
  await c.click(p.getByRole("button", { name: "Book appointment" }).or(p.getByRole("link", { name: "Book appointment" })), "Book appointment");
  await c.click(d().getByRole("button", { name: "Consultation", exact: true }), "Consultation");
  await d().getByLabel("Date").fill(TOMORROW); await p.waitForTimeout(1200);
  await c.click(d().getByRole("button", { name: /^\d{1,2}:\d{2} [AP]M$/ }).first(), "Pick the first free time tomorrow (the seed fills some slots)");
  await c.click(d().getByRole("button", { name: "Book", exact: true }), "Click Book WITHOUT typing the optional note");
  // Q0.4: booking without a note works, so the dialog is already closed here.
  await c.go("/app/messages", "Messages right after booking");
  const r1 = await p.request.get("http://localhost:8787/cdn-cgi/handler/scheduled?cron=*/5+*+*+*+*"); c.note("Ran the 5-minute cron by hand (like Cloudflare does): HTTP " + r1.status());
  await p.waitForTimeout(1500);
  await c.go("/app/messages", "Messages after the cron ran");
  const txt = await c.text(); const parts = txt.split(/(?=(?:remind|confirm) · )/).filter((x) => /Mina/.test(x)).map((x) => x.replace(/ \| Open WhatsApp.*$/, ""));
  console.log("MINA:", parts);
  // Q1.5: during quiet hours (21:00 to 08:00) the confirmation waits under Scheduled; the reminder always does.
  const card = p.getByText(/Dear Mina/).first().locator("xpath=ancestor::li[1]");
  const open = card.getByRole("button", { name: "Open WhatsApp" });
  if (await open.count()) {
    const popupP = p.context().waitForEvent("page", { timeout: 6000 }).catch(() => null);
    await c.click(open, "Click Open WhatsApp on Mina's confirm message");
    const pop = await popupP; c.note("Open WhatsApp opened: " + (pop ? pop.url().slice(0, 300) : "no new tab"));
  } else c.note("No Open WhatsApp yet: Mina's first message is scheduled until its due time");
  await p.waitForTimeout(800);
  await c.look("Messages after Open WhatsApp: where did the message go?");
  console.log("after:", (await c.text()).match(/(Outgoing|Send on WhatsApp|Scheduled|Sent \/ opened|Needs attention|Out of date) \(\d+\)/g));
  console.log("buttons:", (await p.locator("main button, main a").allInnerTexts()).join(" ¦ ").slice(0, 400));
});
