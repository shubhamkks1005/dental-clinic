import { flow } from "./lib2.mjs";
await flow({ id: process.argv[2] || "A02-register-edge-cases", role: "receptionist", vp: "laptop" }, async (c) => {
  const p = c.page; const note = (t) => c.note(t);
  const fresh = async (why) => c.go("/app/patients/new", why);
  const err = async () => (await p.locator("[role=alert], .field-error, .error").allInnerTexts()).join(" / ");
  // 1 Child
  await fresh("CASE 1: a child (age 8) with no guardian entered");
  await c.type(p.getByLabel("Full name"), "Kabir Childtest", "Name");
  await c.click(p.getByLabel("Male", { exact: true }), "Gender");
  await c.type(p.getByLabel("Or age (years)"), "8", "Age 8");
  await c.type(p.locator("input[type=tel]").first(), "9000099020", "Mobile");
  await c.click(p.getByRole("button", { name: "Save patient" }), "Save without a guardian");
  note("Result for child without guardian: " + (await err() || (await c.text()).slice(0, 120)));
  // 2 No mobile
  await fresh("CASE 2: adult with no mobile (tick 'No mobile')");
  await c.type(p.getByLabel("Full name"), "Sumit Nomobile", "Name");
  await c.click(p.getByLabel("Male", { exact: true }), "Gender");
  await c.type(p.getByLabel("Or age (years)"), "45", "Age 45");
  await c.click(p.getByLabel("No mobile"), "Tick No mobile");
  await c.click(p.getByRole("button", { name: "Save patient" }), "Save");
  note("Result no mobile: " + (await err() || (await c.text()).slice(0, 120)));
  // 3 Wrong mobile
  await fresh("CASE 3: mobile with only 9 digits");
  await c.type(p.getByLabel("Full name"), "Wrong Number", "Name"); await c.click(p.getByLabel("Male", { exact: true }), "Gender"); await c.type(p.getByLabel("Or age (years)"), "30", "Age");
  await c.type(p.locator("input[type=tel]").first(), "900009902", "9-digit mobile");
  await c.click(p.getByRole("button", { name: "Save patient" }), "Save");
  note("Result 9 digits: " + (await err()));
  // 4 Duplicate: same name + mobile as seeded Disha Testcase 9000000128
  await fresh("CASE 4: same name and mobile as an existing patient (Disha Testcase, 90000 00128)");
  await c.type(p.getByLabel("Full name"), "Disha Testcase", "Name"); await c.click(p.getByLabel("Female", { exact: true }), "Gender"); await c.type(p.getByLabel("Or age (years)"), "28", "Age");
  await c.type(p.locator("input[type=tel]").first(), "9000000128", "Same mobile as an existing patient"); await p.waitForTimeout(1500);
  await c.look("Is there a duplicate warning before saving?");
  await c.click(p.getByRole("button", { name: "Save patient" }), "Save");
  await c.look("Q1.8: Save asks Same person? before it saves");
  note("Asked 'Same person?': " + ((await p.getByText("Same person?").count()) > 0) + " | saved already: " + ((await p.getByRole("heading", { name: "Patient saved" }).count()) > 0));
  await c.click(p.getByRole("button", { name: "Save as new patient" }), "Choose Save as new patient");
  note("Result duplicate: " + (await err() || (await c.text()).slice(0, 200)));
  // 5 Long name + special characters
  await fresh("CASE 5: very long name with special characters");
  await c.type(p.getByLabel("Full name"), "Ananya-Lakshmi Venkataraman Subramaniam Krishnamurthy-Iyer D'Souza", "Long name"); await c.click(p.getByLabel("Female", { exact: true }), "Gender"); await c.type(p.getByLabel("Or age (years)"), "52", "Age");
  await c.type(p.locator("input[type=tel]").first(), "9000099021", "Mobile");
  await c.click(p.getByRole("button", { name: "Save patient" }), "Save");
  note("Result long name: " + (await c.text()).slice(0, 200));
  await c.go("/app/patients", "See how the long name and the new patients look in the list");
  // 6 Hindi name, DOB in future
  await fresh("CASE 6: Hindi name and a date of birth in the future");
  await c.type(p.getByLabel("Full name"), "रीना शर्मा", "Hindi name"); await c.click(p.getByLabel("Female", { exact: true }), "Gender");
  await p.getByLabel("Date of birth").fill("01/01/2030"); await c.type(p.locator("input[type=tel]").first(), "9000099022", "Mobile");
  await c.click(p.getByRole("button", { name: "Save patient" }), "Save");
  note("Result future DOB: " + (await err() || (await c.text()).slice(0, 200)));
});
