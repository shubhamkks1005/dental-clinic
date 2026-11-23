import { expect, test } from "@playwright/test";

// Q1.8: gender must be chosen, a future date of birth has its own sentence, the guardian fields
// open by themselves for a child, a possible duplicate asks "Same person?", the profile shows the
// next appointment. Fake data only.

test("new patient form rules and the next appointment", async ({ page }) => {
  test.setTimeout(120_000);
  const bad: string[] = [];
  page.on("response", (r) => {
    if (r.url().includes("/api/") && r.status() >= 400 && r.status() !== 400)
      bad.push(`${r.status()} ${r.url()}`);
  });
  const stamp = Date.now().toString().slice(-6);
  const name = `Rules Test ${stamp}`;
  const mobile = `9003${stamp}`;
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.goto("/app/patients/new");

  // Gender has no default.
  await expect(page.getByLabel("Gender")).toHaveValue("");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Or age (years)").fill("30");
  await page.getByLabel("Mobile", { exact: true }).fill(mobile);
  await page.getByRole("button", { name: "Save patient" }).click();
  await expect(page.getByText("Choose female, male or other.")).toBeVisible();

  // Future date of birth.
  await page.getByLabel("Gender").selectOption("male");
  await page.getByLabel("Date of birth").fill("01/01/2035");
  await page.getByRole("button", { name: "Save patient" }).click();
  await expect(page.getByText("The date of birth is in the future.")).toBeVisible();
  await page.getByLabel("Date of birth").fill("");

  // A child: the guardian fields are open without pressing More details.
  await page.getByLabel("Or age (years)").fill("7");
  await expect(page.getByLabel("Guardian name")).toBeVisible();
  await page.getByLabel("Or age (years)").fill("30");
  await expect(page.getByLabel("Guardian name")).toBeHidden();
  await page.getByRole("button", { name: "Save patient" }).click();
  await expect(page.getByRole("heading", { name: "Patient saved" })).toBeVisible();

  // Book tomorrow or later: the profile Overview shows it as the next appointment.
  await page
    .getByRole("button", { name: "Book appointment" })
    .or(page.getByRole("link", { name: "Book appointment" }))
    .click();
  const dialog = page.locator("dialog[open]");
  await dialog.getByLabel("Visit type").selectOption({ label: "Consultation" });
  const times = dialog.getByRole("button", { name: /^\d{1,2}:\d{2} [AP]M$/ });
  for (let day = 2; day <= 8; day++) {
    await dialog
      .getByLabel("Date")
      .fill(new Date(Date.now() + day * 86_400_000).toISOString().slice(0, 10));
    await page.waitForTimeout(1200);
    if ((await times.count()) > 0) break;
  }
  await times.first().click();
  await dialog.getByRole("button", { name: "Book", exact: true }).click();
  await expect(page.locator(".toast-text", { hasText: /Booked for/ })).toBeVisible();

  // Same name and mobile again: the warning shows and Save asks "Same person?".
  await page.goto("/app/patients/new");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Gender").selectOption("male");
  await page.getByLabel("Or age (years)").fill("30");
  await page.getByLabel("Mobile", { exact: true }).fill(mobile);
  await expect(page.getByText("Possible match")).toBeVisible();
  await page.getByRole("button", { name: "Save patient" }).click();
  await expect(page.getByText("Same person?")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Patient saved" })).toBeHidden();
  const open = page.getByRole("link", { name: "Open existing" });
  await open.click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Next appointment" })
      .or(page.locator("#next-appt-title").locator("xpath=..")),
  ).toContainText("Consultation");

  expect(bad, bad.join("\n")).toEqual([]);
});
