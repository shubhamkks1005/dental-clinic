import { expect, test } from "@playwright/test";

// Q2.9: field order, gender buttons, reminders need a number, Save and book. Fake data only.
// SHOTS=1 saves screenshots to docs/ui-audit/screenshots/redesign/Q2.9/.
const SHOTS = process.env.SHOTS ? "docs/ui-audit/screenshots/redesign/Q2.9" : "";

test("new patient: order, big gender buttons, reminders off without a number, save and book", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const stamp = Date.now().toString().slice(-6);
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.goto("/app/patients/new");

  // Patient number is a small chip in the header, not a row of the form.
  await expect(page.getByText("Patient no. is assigned when you save")).toBeVisible();
  await expect(page.locator(".new-patient-code")).toHaveCount(0);

  // Order: name, mobile, gender, then age.
  const y = async (label: string | RegExp, exact = false) =>
    (await page.getByLabel(label, { exact }).first().boundingBox())!.y;
  expect(await y("Full name")).toBeLessThan(await y("Mobile", true));
  expect(await y("Mobile", true)).toBeLessThan(await y("Female", true));
  expect(await y("Female", true)).toBeLessThan(await y("Or age (years)"));
  const box = await page.locator(".new-patient-seg-item span").first().boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  // No mobile: the reminders box is off and says why. Promo is under More details.
  await page.getByLabel("No mobile", { exact: true }).check();
  await expect(page.getByLabel("Allow reminders")).toBeDisabled();
  await expect(page.getByText(/Add a mobile number or a guardian's number/)).toBeVisible();
  await expect(page.getByLabel(/Promo messages/)).toHaveCount(0);
  await page.getByLabel("No mobile", { exact: true }).uncheck();
  await expect(page.getByLabel("Allow reminders")).toBeEnabled();
  await page.getByRole("button", { name: "More details" }).click();
  await expect(page.getByLabel(/Promo messages/)).toBeVisible();
  await page.getByRole("button", { name: "Hide extra details" }).click();

  await page.getByLabel("Full name").fill(`Form Test ${stamp}`);
  await page.getByLabel("Mobile", { exact: true }).fill(`9005${stamp}`);
  await page.getByLabel("Female", { exact: true }).check();
  await page.getByLabel("Or age (years)").fill("31");
  await page.getByLabel("Privacy notice given").check();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/PhoneNewPatient.png` });
  await page.getByRole("button", { name: "Save and book appointment" }).click();
  await expect(page).toHaveURL(/\/app\/appointments\?.*patient=/);
  await expect(page.locator("dialog[open]")).toContainText(`Form Test ${stamp}`);
});

test("new patient: after Save patient the next step is one primary button", async ({ page }) => {
  const stamp = Date.now().toString().slice(-6);
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.goto("/app/patients/new");
  await page.getByLabel("Full name").fill(`Saved Test ${stamp}`);
  await page.getByLabel("Mobile", { exact: true }).fill(`9006${stamp}`);
  await page.getByLabel("Male", { exact: true }).check();
  await page.getByLabel("Or age (years)").fill("40");
  await page.getByRole("button", { name: "Save patient" }).click();
  await expect(page.getByRole("heading", { name: "Patient saved" })).toBeVisible();
  await expect(page.locator(".new-patient-next .btn-primary")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Open patient" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Walk-in now" })).toBeVisible();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/NewPatientSaved.png` });
});
