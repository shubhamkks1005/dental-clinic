import { flow } from "./lib2.mjs";
await flow({ id: process.argv[2] || "F04-double-click-offline-back-and-reload", role: "receptionist", vp: "laptop" }, async (c) => {
  const p = c.page; const d = () => p.locator("dialog[open]"); const ctx = p.context();
  const outst = async () => ((await c.text()).match(/Outstanding: [^|]*/) || [""])[0];
  // 1 double click on Record payment
  await c.go("/app/patients", "CASE 1: a nervous double click on Record payment");
  await c.click(p.getByRole("link", { name: "Neha Testcase" }).first(), "Open Neha (owes ₹2,500)");
  await c.click(p.getByRole("tab", { name: "Billing", exact: true }), "Billing tab");
  await c.type(p.getByLabel(/Amount/).first(), "100", "Amount 100");
  c.note("Before: " + (await outst()));
  await p.getByRole("button", { name: "Record payment" }).dblclick(); await p.waitForTimeout(1500);
  c.note("After a double click on Record payment of ₹100: " + (await outst()) + " (one payment = ₹2,400, two = ₹2,300)");
  await c.look("After the double click");
  // 2 double click Save patient
  await c.go("/app/patients/new", "CASE 2: double click on Save patient");
  await c.type(p.getByLabel("Full name"), "Double Click", "Name"); await c.click(p.getByLabel("Male", { exact: true }), "Gender"); await c.type(p.getByLabel("Or age (years)"), "29", "Age"); await c.type(p.locator("input[type=tel]").first(), "9000099050", "Mobile");
  await p.getByRole("button", { name: "Save patient" }).dblclick(); await p.waitForTimeout(1800);
  await c.go("/app/patients", "Patients list: how many 'Double Click' patients exist now?");
  await c.type(p.getByPlaceholder(/Search by name|mobile|patient code/).last(), "Double Click", "Search"); await p.waitForTimeout(1000);
  c.note("Patients named Double Click after one double click on Save: " + ((await c.text()).match(/Double Click/g) || []).length);
  await c.look("Search result");
  // 3 offline
  await c.go("/app", "CASE 3: the clinic's internet drops");
  await ctx.setOffline(true); await p.waitForTimeout(1500); await c.look("Offline: is there a banner?");
  c.note("Banner text: " + (await p.locator("[role=status], [role=alert], .offline").allInnerTexts()).join(" / "));
  await c.go("/app/patients/new", "Open New patient while offline").catch(() => c.note("Navigation failed while offline (expected: single-page app may still work)"));
  await c.click(p.getByRole("link", { name: "Patients" }).first(), "Click Patients in the sidebar while offline").catch(() => c.note("Click failed"));
  await c.look("Patients list while offline");
  c.note("Patients page offline shows: " + (await c.text()).slice(0, 160));
  await ctx.setOffline(false); await p.waitForTimeout(1500); await c.look("Back online");
  // 4 back button after save
  await c.go("/app/patients/new", "CASE 4: Back button right after saving a patient");
  await c.type(p.getByLabel("Full name"), "Back Button", "Name"); await c.click(p.getByLabel("Male", { exact: true }), "Gender"); await c.type(p.getByLabel("Or age (years)"), "31", "Age"); await c.type(p.locator("input[type=tel]").first(), "9000099051", "Mobile");
  await c.click(p.getByRole("button", { name: "Save patient" }), "Save patient");
  await p.goBack(); await p.waitForTimeout(800); await c.look("After pressing the browser Back button on the 'Patient saved' screen");
  c.note("Back button leads to: " + p.url() + " | form is " + ((await p.getByLabel("Full name").inputValue().catch(() => "n/a")) || "empty") );
  // 5 leave a half-filled form
  await c.go("/app/patients/new", "CASE 5: half-filled new patient form, then click another menu item");
  await c.type(p.getByLabel("Full name"), "Half Filled", "Name");
  await c.click(p.getByRole("link", { name: "Billing" }).first(), "Click Billing in the sidebar with a half-filled form");
  c.note("After leaving a half-filled form: url " + p.url() + "; dialog: " + (await d().innerText().catch(() => "none")).replace(/\n+/g, " | ").slice(0, 200));
  await c.look("What happened to the half-filled form?");
});
