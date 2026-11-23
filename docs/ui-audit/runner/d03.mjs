import { flow } from "./lib2.mjs";
await flow({ id: process.argv[2] || "D03-payments-advance-split-part-and-mistakes", role: "receptionist", vp: "laptop" }, async (c) => {
  const p = c.page; const err = async () => (await p.locator(".error-text, [role=alert]").allInnerTexts()).join(" / ");
  const out = async () => ((await c.text()).match(/Outstanding: [^|]*/) || [""])[0];
  const open = async (name, why) => { await c.go("/app/patients", "Patients list"); await c.click(p.getByRole("link", { name }).first(), why); await c.click(p.getByRole("tab", { name: "Billing", exact: true }), "Open the Billing tab"); };
  // 1 patient with nothing due: can an advance be taken?
  await c.go("/app/patients/new", "CASE 1: a patient who wants to pay in advance (no bill yet)");
  await c.type(p.getByLabel("Full name"), "Adv Paytest", "Name"); await c.pick(p.getByLabel("Gender"), "Male", "Gender"); await c.type(p.getByLabel("Or age (years)"), "40", "Age"); await c.type(p.locator("input[type=tel]").first(), "9000099030", "Mobile");
  await c.click(p.getByRole("button", { name: "Save patient" }), "Save patient");
  await open("Adv Paytest", "Open the new patient");
  await c.look("Billing tab of a patient with no bill: where is Take payment?");
  c.note("Result: " + (await out()) + " | form present: " + (await p.getByLabel(/Amount/).count()));
  // 2 split payment
  await open("Neha Testcase", "CASE 2: Neha owes ₹2,500, pays ₹1,000 cash + ₹500 UPI (split)");
  await c.click(p.getByLabel(/Split with a second mode/), "Tick 'Split with a second mode'");
  await c.look("Split form: second mode and second amount appear");
  await p.locator("input[type=number]").nth(0).fill("1000"); await p.locator("input[type=number]").nth(1).fill("500");
  await c.click(p.getByRole("button", { name: "Record payment" }), "Record the split payment");
  await c.look("After the split payment");
  c.note("Outstanding after split: " + (await out()) + " | " + (await err()));
  // 3 decimal
  await open("Om Testcase", "CASE 3: Om owes ₹750; the receptionist types 100.50");
  await c.type(p.getByLabel(/Amount/).first(), "100.50", "Type 100.50");
  await c.click(p.getByRole("button", { name: "Record payment" }), "Record");
  await c.look("After 100.50");
  c.note("Outstanding: " + (await out()) + " | msg: " + (await err()));
  // 4 negative and zero and text
  await open("Kiran Testcase", "CASE 4: Kiran owes ₹250; types -50, then 0");
  await p.getByLabel(/Amount/).first().fill("-50");
  const btn = p.getByRole("button", { name: "Record payment" });
  c.note("Record payment enabled for -50? " + (await btn.isEnabled()));
  await p.getByLabel(/Amount/).first().fill("0");
  c.note("Record payment enabled for 0? " + (await btn.isEnabled()) + " | sentence: " + (await err()) + " | " + ((await c.text()).match(/Enter an amount above 0[^|]*/) || [""])[0]);
  await c.look("Form with 0 typed");
  // 5 overpay
  await open("Vikram Testcase", "CASE 5: Vikram owes ₹2,000; a slip of the finger types 20000");
  await c.type(p.getByLabel(/Amount/).first(), "20000", "Type 20000");
  await c.click(p.getByRole("button", { name: "Record payment" }), "Record payment of ₹20,000 against ₹2,000 due");
  await c.look("Q0.6: the screen asks before recording more than the balance");
  c.note("Asked first (nothing recorded yet): " + (await out()) + " | " + (await err()) + " | confirm shown: " + ((await p.getByRole("button", { name: "Record as advance" }).count()) > 0));
  await c.click(p.getByRole("button", { name: "Change amount" }), "Choose Change amount: nothing is recorded");
  c.note("After Change amount: " + (await out()));
  await c.type(p.getByLabel(/Amount/).first(), "2000", "Type the right amount, 2000");
  await c.click(p.getByRole("button", { name: "Record payment" }), "Record ₹2,000");
  await c.look("After the right payment");
  c.note("Header now says: " + (await out()) + " | msg: " + (await err()));
  const id = p.url().split("/").pop();
  await c.go("/app/print/statement/" + id, "Open the printed statement for Vikram");
});
