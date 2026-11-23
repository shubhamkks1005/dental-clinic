import { flow } from "./lib2.mjs";
await flow({ id: process.argv[2] || "D06-discount-request-and-approval", role: "doctor", vp: "laptop" }, async (c) => {
  const p = c.page; const d = () => p.locator("dialog[open]");
  const msg = async () => (await p.locator(".error-text, [role=alert], [role=status], .toast").allInnerTexts()).join(" / ").replace(/\n+/g, " ").slice(0, 300);
  const billText = async () => (await c.text()).slice(0, 700);
  // doctor prepares a finalised visit with a draft bill (setup)
  await c.go("/app", "SETUP: the doctor finishes a visit so that a draft bill exists");
  await c.click(p.getByRole("button", { name: "Open visit" }).or(p.getByRole("link", { name: "Open visit" })).first(), "Open the visit in chair (Tara)");
  await c.click(p.getByRole("tab", { name: "Chart", exact: true }), "Chart tab");
  await c.click(p.getByRole("button", { name: /^Tooth 36, permanent/ }), "Click tooth 36");
  await c.click(p.getByRole("button", { name: "Add procedure" }), "Add procedure (Scaling ₹1,500)");
  await c.click(p.getByRole("button", { name: "Finalise visit" }), "Finalise visit");
  await c.click(d().getByRole("button", { name: "Finalise" }), "Confirm Finalise");
  await c.click(p.getByRole("button", { name: "Create bill" }), "Create bill (a draft bill opens)");
  const billUrl = new URL(p.url()).pathname;
  // receptionist asks for a discount
  await c.as("receptionist", "PART 1: the receptionist opens the same draft bill; the patient asks for a discount");
  await c.go(billUrl, "Open the draft bill as receptionist"); await c.look("Draft bill as the receptionist sees it");
  c.note("Receptionist's draft bill: " + (await billText()));
  const amt = p.getByLabel(/Amount/).last();
  await c.type(amt, "300", "Type discount amount 300");
  await c.click(p.getByRole("button", { name: "Request discount" }), "Click Request discount");
  await c.look("After the receptionist requests a discount");
  c.note("After request: " + (await msg()) + " | " + (await billText()).slice(0, 400));
  c.note("EDGE: with the discount waiting, the receptionist sees an 'Issue bill' button: " + ((await p.getByRole("button", { name: "Issue bill" }).count()) > 0) + " (before the request she had one)");
  // doctor sees it?
  await c.as("doctor", "PART 2: the doctor looks for the request");
  await c.go("/app", "Doctor Today: is there anything about a discount request?"); await c.look("Doctor Today");
  c.note("Today mentions discount: " + /discount/i.test(await c.text()));
  await c.go(billUrl, "Doctor opens the bill"); await c.look("Doctor's view of the bill with a pending discount");
  c.note("Doctor's bill: " + (await billText()));
  const ap = p.getByRole("button", { name: "Approve discount" });
  if (await ap.count()) { await c.click(ap, "Doctor clicks Approve discount"); await c.look("After approval"); c.note("After approve: " + (await msg()) + " | " + (await billText()).slice(0, 360)); }
  else c.note("No Approve discount button for the doctor (bill may have been issued already)");
  const iss = p.getByRole("button", { name: "Issue bill" });
  if (await iss.count()) { await c.click(iss, "Doctor clicks Issue bill"); await c.look("Issued bill with discount"); c.note("Issued: " + (await billText()).slice(0, 360)); }
});
