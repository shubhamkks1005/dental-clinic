import { expect, test } from "@playwright/test";

// Q0.4: booking with the optional note left empty must work (C4: "expected string, received null").

function isoDate(daysAhead: number): string {
  const d = new Date(Date.now() + daysAhead * 86_400_000);
  return d.toISOString().slice(0, 10);
}

test("receptionist books a future slot with the note empty", async ({ page }) => {
  const bad: string[] = [];
  page.on("response", (r) => {
    if (r.url().includes("/api/") && r.status() >= 400) bad.push(`${r.status()} ${r.url()}`);
  });
  const stamp = Date.now().toString().slice(-6);

  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await page.goto("/app/patients/new");
  await page.getByLabel("Full name").fill(`Book Test ${stamp}`);
  await page.getByLabel("Gender").selectOption("female");
  await page.getByLabel("Or age (years)").fill("30");
  await page.getByLabel("Mobile", { exact: true }).fill(`9000${stamp}`);
  await page.getByRole("button", { name: "Save patient" }).click();
  await expect(page.getByRole("heading", { name: "Patient saved" })).toBeVisible();

  await page
    .getByRole("button", { name: "Book appointment" })
    .or(page.getByRole("link", { name: "Book appointment" }))
    .click();
  const dialog = page.locator("dialog[open]");
  await dialog.getByLabel("Visit type").selectOption({ label: "Consultation" });

  // First of the next 7 days that has a free time (closed days have none).
  const times = dialog.getByRole("button", { name: /^\d{1,2}:\d{2} [AP]M$/ });
  for (let day = 1; day <= 7; day++) {
    await dialog.getByLabel("Date").fill(isoDate(day));
    await page.waitForTimeout(1200);
    if ((await times.count()) > 0) break;
  }
  await times.first().click();
  // Note stays empty on purpose.
  await dialog.getByRole("button", { name: "Book", exact: true }).click();

  await expect(page.getByText(/Booked for/)).toBeVisible();
  expect(bad, bad.join("\n")).toEqual([]);
});
