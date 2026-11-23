import { flow } from "./lib2.mjs";
await flow({ id: process.argv[2] || "D05-dues-reminder-and-daily-cash-close", role: "receptionist", vp: "laptop" }, async (c) => {
  const p = c.page; const d = () => p.locator("dialog[open]");
  const err = async () => (await p.locator(".error-text, [role=alert], .banner, .toast").allInnerTexts()).join(" / ").slice(0, 300);
  // ---- Part 1: chase dues ----
  await c.go("/app/billing", "PART 1: receptionist opens Billing to chase unpaid dues");
  await c.click(p.getByRole("button", { name: "Add call note" }).first(), "Click Add call note on the first patient");
  await c.look("Call note form opens inside the row");
  const ins = p.locator("main input, main textarea");
  await ins.nth(0).fill("Called, said will pay on Friday"); await c.look("Typed the note");
  console.log("note form fields:", await p.locator("main li input, main li textarea, main li select").evaluateAll(e=>e.map(x=>x.type+":"+(x.placeholder||x.getAttribute("aria-label")||x.name))));
  await c.click(p.getByRole("button", { name: /^Save/ }).first(), "Save the call note").catch(() => c.note("No Save button found on the call note form"));
  const popP = p.context().waitForEvent("page", { timeout: 5000 }).catch(() => null);
  await c.click(p.getByRole("button", { name: "WhatsApp reminder" }).first(), "Click WhatsApp reminder");
  const pop = await popP; c.note("WhatsApp text: " + (pop ? decodeURIComponent(pop.url()).replace(/\+/g, " ").slice(0, 250) : "no tab"));
  await c.look("After WhatsApp reminder: toast");
  // ---- Part 2: close the day ----
  await c.go("/app/patients", "PART 2 starts: first take one cash payment today so the day has money in it");
  await c.click(p.getByRole("link", { name: "Neha Testcase" }).first(), "Open Neha Testcase");
  await c.click(p.getByRole("tab", { name: "Billing", exact: true }), "Billing tab");
  await c.type(p.getByLabel(/Amount/).first(), "500", "Type 500");
  await c.click(p.getByRole("button", { name: "Record payment" }), "Record ₹500 cash");
  await c.go("/app/billing", "End of day: open the Daily cash close panel");
  await p.getByText("Daily cash close").scrollIntoViewIfNeeded(); await c.look("Daily cash close panel, scrolled into view");
  c.note("Panel says: " + ((await c.text()).match(/Daily cash close[\s\S]{0,420}/) || [""])[0]);
  await c.click(p.getByRole("button", { name: "Close day" }), "Try Close day straight away").catch(() => c.note("Close day is disabled"));
  await c.look("After trying to close with open appointments");
  // resolve the open appointments on Today
  await c.go("/app", "Go to Today to finish the open appointments (one is 'Arrived', one 'In chair' from earlier)");
  await c.look("Today rows before cleanup");
  // Q1.4: Cancel lives in the "..." menu and asks for a reason. Finish every open row that way
  // (a fresh database has only scheduled or confirmed rows today).
  for (let i = 0; i < 6; i++) {
    const done = p.getByRole("button", { name: "Completed" }).first();
    if (await done.count()) { await c.click(done, "Mark the in-chair patient Completed"); continue; }
    const more = p.getByRole("button", { name: /More actions for/ }).first();
    if (!(await more.count())) break;
    await c.click(more, "Open the ... menu of an open row");
    await c.click(p.getByRole("menuitem", { name: "Cancel" }), "Choose Cancel");
    await c.pick(d().getByLabel("Reason"), { label: "Patient asked to cancel" }, "Pick the reason");
    await c.click(d().getByRole("button", { name: "Cancel appointment" }), "Confirm the cancel with its reason");
  }
  await c.look("Today after the open rows were finished");
  await c.go("/app/billing", "Back to Billing, panel again");
  await p.getByText("Daily cash close").scrollIntoViewIfNeeded(); await c.look("Panel after the appointments were finished");
  c.note("Panel now says: " + ((await c.text()).match(/Daily cash close[\s\S]{0,300}/) || [""])[0]);
  await c.type(p.getByLabel(/Counted cash/), "450", "Count the drawer: ₹450 (₹50 less than expected)");
  await c.click(p.getByRole("button", { name: "Close day" }), "Click Close day with a difference and no note");
  await c.look("What does the panel say?");
  c.note("Message: " + (await err()) + " | panel: " + ((await c.text()).match(/Cash expected[\s\S]{0,260}/) || [""])[0]);
  await c.type(p.getByLabel(/Note \(required/), "Gave change from own pocket", "Type a note");
  await c.click(p.getByRole("button", { name: "Close day" }), "Click Close day with the note");
  await c.look("Day closed?");
  c.note("After close: " + ((await c.text()).match(/Daily cash close[\s\S]{0,350}/) || [""])[0]);
  await c.go("/app/patients", "Now try to take another payment for today");
  await c.click(p.getByRole("link", { name: "Om Testcase" }).first(), "Open Om Testcase");
  await c.click(p.getByRole("tab", { name: "Billing", exact: true }), "Billing tab");
  await c.type(p.getByLabel(/Amount/).first(), "100", "Type 100");
  await c.click(p.getByRole("button", { name: "Record payment" }), "Record ₹100 after the day is closed");
  await c.look("Result of a payment on a closed day");
  c.note("Message: " + (await err()) + " | " + ((await c.text()).match(/Outstanding: [^|]*/) || [""])[0]);
});
