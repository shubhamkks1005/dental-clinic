import { expect, type Page } from "@playwright/test";

// Shared by the calendar specs. Fake data only.

export function isoDate(daysAhead: number): string {
  return new Date(Date.now() + daysAhead * 86_400_000).toISOString().slice(0, 10);
}

export async function registerPatient(page: Page, name: string, stamp: string) {
  await page.goto("/app/patients/new");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Female", { exact: true }).check();
  await page.getByLabel("Or age (years)").fill("30");
  await page.getByLabel("Mobile", { exact: true }).fill(`9000${stamp}`);
  await page.getByRole("button", { name: "Save patient" }).click();
  await expect(page.getByRole("heading", { name: "Patient saved" })).toBeVisible();
}

/** Books the first free time on one of the next 7 days; returns that date. */
export async function bookFutureSlot(page: Page): Promise<string> {
  await page
    .getByRole("button", { name: "Book appointment" })
    .or(page.getByRole("link", { name: "Book appointment" }))
    .click();
  const dialog = page.locator("dialog[open]");
  await dialog.getByRole("button", { name: "Consultation", exact: true }).click();
  const times = dialog.getByRole("button", { name: /^\d{1,2}:\d{2} [AP]M$/ });
  let date = "";
  for (let day = 1; day <= 7; day++) {
    date = isoDate(day);
    await dialog.getByLabel("Date").fill(date);
    await page.waitForTimeout(1200);
    if ((await times.count()) > 0) break;
  }
  await times.first().click();
  await dialog.getByRole("button", { name: "Book", exact: true }).click();
  await expect(page.locator(".toast-text", { hasText: /Booked for/ })).toBeVisible();
  return date;
}
