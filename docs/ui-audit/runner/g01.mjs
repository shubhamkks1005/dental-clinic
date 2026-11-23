import { flow } from "./lib2.mjs";
const TOMORROW = new Date(Date.now() + 330 * 60_000 + 86_400_000).toISOString().slice(0, 10); // tomorrow in IST, computed, so the script works on any day
const NAME = "Riya Flowtest", MOB = "9000099001";
await flow({ id: process.argv[2] || "G01-first-patient-lifecycle", role: "receptionist", vp: "laptop" }, async (c) => {
  const p = c.page; const d = () => p.locator("dialog[open]");
  // ---- Receptionist: register ----
  await c.go("/app", "Receptionist starts on Today");
  await c.click(p.getByRole("link", { name: "+ New patient" }), "Click + New patient in the top bar");
  await c.type(p.getByLabel("Full name"), NAME, "Type the name");
  await c.pick(p.getByLabel("Gender"), "Female", "Choose gender");
  await c.type(p.getByLabel("Or age (years)"), "27", "Type age (date of birth not known)");
  await c.type(p.locator("input[type=tel]").first(), MOB, "Type mobile number");
  await c.click(p.getByLabel("Privacy notice shown"), "Tick Privacy notice shown");
  await c.click(p.getByLabel("SMS reminders allowed"), "Tick SMS reminders allowed");
  await c.click(p.getByRole("button", { name: "Save patient" }), "Click Save patient (result: Patient saved screen)");
  // ---- Receptionist: phone booking for tomorrow ----
  await c.click(p.getByRole("button", { name: "Book appointment" }).or(p.getByRole("link", { name: "Book appointment" })), "Click Book appointment on the saved screen");
  await c.pick(d().getByLabel("Visit type"), { label: "Consultation" }, "Choose visit type Consultation");
  await d().getByLabel("Date").fill(TOMORROW); await p.waitForTimeout(1200);
  await c.look("Date set to tomorrow: free times appear");
  await c.click(d().getByRole("button", { name: /^\d{1,2}:\d{2} [AP]M$/ }).first(), "Pick the first free time");
  await c.type(d().getByLabel(/What they said/), "Wants to check teeth alignment", "Type the phone note");
  await c.click(d().getByRole("button", { name: "Book", exact: true }), "Click Book (result: toast, calendar opens on that date)");
  await c.go("/app/messages", "Open Messages to look for the confirm message");
  // ---- Clinic day (simulated with an emergency walk-in because it is after hours) ----
  await c.go("/app", "Back on Today. Tomorrow's booking is not in today's list");
  await c.click(p.getByRole("button", { name: "Walk-in" }).last(), "Click Walk-in on Today");
  await c.type(d().getByLabel("Patient"), "Riya", "Type patient name"); await p.waitForTimeout(900);
  await c.click(d().locator("button.quick-book-result"), "Pick the patient from the list");
  await c.pick(d().getByLabel("Visit type"), { label: "Consultation" }, "Choose Consultation");
  // Tick Emergency first: it works at any time of day (a free slot may or may not exist today).
  await c.click(d().getByRole("checkbox"), "Tick Emergency (may overbook)");
  await c.click(d().getByRole("button", { name: /Add walk-in/ }), "Click Add walk-in again with Emergency ticked");
  await c.look("Today list after the walk-in");

  await c.click(p.getByRole("button", { name: "In chair" }).last(), "Click In chair on Riya's row");
  // ---- Doctor ----
  await c.as("doctor", "Switch to the doctor");
  await c.click(p.getByRole("link", { name: "Open visit" }).or(p.getByRole("button", { name: "Open visit" })).last(), "Doctor clicks Open visit on Riya's row");
  await c.type(p.getByLabel("Chief complaint"), "Wants alignment check, mild crowding lower front", "Type chief complaint");
  await c.type(p.getByLabel("Exam"), "Crowding lower anterior, no caries seen", "Type exam");
  await p.waitForTimeout(1800);
  await c.click(p.getByRole("tab", { name: "Chart", exact: true }), "Open the Chart tab");
  await c.click(p.getByRole("button", { name: /^Tooth 36, permanent/ }), "Click tooth 36 on the chart");
  // Q1.8: the procedure list starts empty, so choose one first (Add stays off until then).
  await c.pick(p.getByRole("region", { name: "Procedures" }).last().getByLabel("Procedure"), { index: 1 }, "Choose the first procedure in the list");
  await c.click(p.getByRole("button", { name: "Add procedure" }), "Click Add procedure");
  await c.click(p.getByRole("tab", { name: "Today's visit", exact: true }), "Back to the first tab to add a diagnosis");
  await c.type(p.getByPlaceholder(/Type to search or enter free text/), "Crowding", "Type diagnosis");
  await c.click(p.getByRole("button", { name: "Add", exact: true }), "Click Add (diagnosis)");
  await c.click(p.getByRole("tab", { name: "Medicines", exact: true }), "Open the Medicines tab");
  await c.type(p.getByPlaceholder(/Search medicine/), "Amox", "Search Amox");
  await c.key("Enter", "Press Enter to add Amoxicillin");
  await c.click(p.getByRole("button", { name: "Issue" }), "Click Issue (prescription)");
  await c.look("After Issue: error shown");
  await c.click(p.getByRole("button", { name: "Finalise visit" }), "Click Finalise visit");
  await c.click(d().getByRole("button", { name: "Finalise" }), "Confirm Finalise in the dialog");
  await c.click(p.getByRole("button", { name: "Create bill" }), "Click Create bill");
  console.log("bill url:", p.url()); console.log((await c.text()).slice(0, 800));

  await c.click(p.getByRole("button", { name: "Issue bill" }), "Click Issue bill (bill is a draft until issued)");
  console.log("issue bill:", JSON.stringify(c.steps.at(-1).visible), c.steps.at(-1).errors); console.log((await c.text()).slice(0, 700));
  await c.as("receptionist", "Switch to the receptionist to take payment");
  await c.look("Receptionist Today after the doctor finalised: is there a cue that Riya is ready to bill?");
  await c.type(p.getByPlaceholder(/Search by name/).first(), "Riya", "Search Riya in the top bar"); await p.waitForTimeout(1000);
  await c.look("Search results dropdown");
  console.log("search results:", await p.locator("[role=listbox] *, [role=option], .search-result, .patient-search li").allInnerTexts().catch(()=>[]));
  await c.key("Enter", "Press Enter on the first result");
  console.log("url:", p.url());
  await c.click(p.getByRole("tab", { name: "Billing", exact: true }), "Open the Billing tab of Riya");
  console.log((await c.text()).slice(0, 700));
  await c.type(p.getByLabel(/Amount/), "500", "Type amount 500");
  await c.click(p.getByRole("button", { name: "Record payment" }), "Click Record payment");
  await c.look("After Record payment: balance changed, is there a toast or receipt?");
  console.log("after pay:", JSON.stringify(c.steps.at(-1).visible), c.steps.at(-1).errors); console.log((await c.text()).slice(0, 900));

  const pid = p.url().split("/").pop();
  await c.click(p.getByRole("link", { name: /SB-/ }).first(), "Open the bill to look for a receipt");
  console.log("bill page:", (await c.text()).slice(0, 500));
  await c.go("/app/patients/" + pid, "Go back to the patient profile (the bill page has no link back to the patient except Patient account)");
  await c.click(p.getByRole("tab", { name: "Billing", exact: true }), "Billing tab again");
  // Q0.6: Full balance only fills the Amount box; the payment is recorded by Record payment.
  await c.click(p.getByRole("button", { name: "Full balance" }), "Click Full balance (it only fills the Amount box now)");
  await c.look("After Full balance: the Amount box holds the balance, nothing is recorded yet");
  await c.click(p.getByRole("button", { name: "Record payment" }), "Click Record payment for the full balance");
  await c.look("After the second payment: the toast has Print, the bill is paid");
  console.log("after 2nd pay:", (await c.text()).slice(0, 400));
  await c.go("/app/print/statement/" + pid, "Open the patient statement print page");
  console.log("statement:", (await p.locator("body").innerText()).replace(/\n+/g, " | ").slice(0, 700));
  await c.go("/app/patients/" + pid, "Open the patient profile (History tab) to see what the record looks like now");
});
