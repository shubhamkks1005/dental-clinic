import { expect, test, type Page } from "@playwright/test";

// Q2.7: week calendar (laptop), day list (phone), new Book dialog (chips, date strip, footer).
// Fake data only. SHOTS=1 saves the screenshots for docs/ui-audit/screenshots/redesign/Q2.7/.
const SHOTS = process.env.SHOTS ? "docs/ui-audit/screenshots/redesign/Q2.7" : "";

function isoDate(daysAhead: number): string {
  return new Date(Date.now() + daysAhead * 86_400_000).toISOString().slice(0, 10);
}

async function noSideways(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

async function newPatient(page: Page, name: string, stamp: string) {
  await page.goto("/app/patients/new");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Female", { exact: true }).check();
  await page.getByLabel("Or age (years)").fill("29");
  await page.getByLabel("Mobile", { exact: true }).fill(`9004${stamp}`);
  await page.getByRole("button", { name: "Save patient" }).click();
  await expect(page.getByRole("heading", { name: "Patient saved" })).toBeVisible();
}

async function openBook(page: Page, name: string) {
  await page.goto("/app/appointments?view=day");
  await page.getByRole("button", { name: "Book appointment" }).click();
  const dialog = page.locator("dialog[open]");
  await dialog.getByLabel("Patient").fill(name);
  await dialog.locator("button.quick-book-result").first().click();
  await dialog.getByRole("button", { name: "Consultation", exact: true }).click();
  return dialog;
}

test("book dialog: seven day strip, eight time chips, More times, fixed footer, empty day text", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const bad: string[] = [];
  page.on("response", (r) => {
    if (r.url().includes("/api/") && r.status() >= 400) bad.push(`${r.status()} ${r.url()}`);
  });
  const stamp = Date.now().toString().slice(-6);
  const name = `Cal Test ${stamp}`;
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await newPatient(page, name, stamp);

  await page.setViewportSize({ width: 360, height: 740 });
  const dialog = await openBook(page, name);
  const strip = dialog.getByRole("group", { name: "Next 7 days" });
  await expect(strip.getByRole("button")).toHaveCount(7);

  // A day far enough ahead to have many free times: the strip's last day (or a later open day).
  const times = dialog.getByRole("button", { name: /^\d{1,2}:\d{2} [AP]M$/ });
  let found = false;
  for (let i = 1; i < 7 && !found; i++) {
    await strip.getByRole("button").nth(i).click();
    await page.waitForTimeout(1200);
    found = (await times.count()) > 0;
  }
  expect(found).toBe(true);
  expect(await times.count()).toBeLessThanOrEqual(9); // 8 chips (+1 if a calendar time is kept)
  await dialog.getByRole("button", { name: "Consultation", exact: true }).scrollIntoViewIfNeeded();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/PhoneBook.png` });
  const more = dialog.getByRole("button", { name: "More times" });
  if (await more.isVisible()) {
    const before = await times.count();
    await more.click();
    expect(await times.count()).toBeGreaterThan(before);
  }
  await expect(dialog.getByLabel(/Note/)).toBeVisible();
  // The Book button stays reachable at 360 px without scrolling the page behind.
  const book = dialog.getByRole("button", { name: "Book", exact: true });
  await expect(book).toBeInViewport();
  const box = await book.boundingBox();
  expect(box && box.height >= 44).toBe(true);
  await noSideways(page);

  // An empty day says so and names the next day to try (Sundays are closed).
  const sunday = Array.from({ length: 8 }, (_, i) => isoDate(i + 1)).find(
    (d) => new Date(`${d}T12:00:00Z`).getUTCDay() === 0,
  ) as string;
  await dialog.getByLabel(/More dates/).fill(sunday);
  await expect(dialog.getByText(/^No free times on .* Try Monday\.$/)).toBeVisible();
  await page.keyboard.press("Escape");
  expect(bad, bad.join("\n")).toEqual([]);
});

test("calendar: week on a laptop, day list on a phone", async ({ page }) => {
  test.setTimeout(120_000);
  const stamp = Date.now().toString().slice(-6);
  const name = `Wk Test ${stamp}`;
  await page.goto("/api/staff/auth/dev-login?role=receptionist");
  await newPatient(page, name, stamp);
  await page.setViewportSize({ width: 1366, height: 768 });
  const dialog = await openBook(page, name);
  const times = dialog.getByRole("button", { name: /^\d{1,2}:\d{2} [AP]M$/ });
  let date = "";
  for (let day = 1; day <= 7; day++) {
    date = isoDate(day);
    await dialog.getByLabel(/More dates/).fill(date);
    await page.waitForTimeout(1200);
    if ((await times.count()) > 0) break;
  }
  await times.first().click();
  await dialog.getByRole("button", { name: "Book", exact: true }).click();
  await expect(page.locator(".toast-text", { hasText: /Booked for/ })).toBeVisible();

  // Laptop: week grid is the default and shows the booking.
  await page.goto(`/app/appointments?date=${date}`);
  await expect(page.getByRole("group", { name: "View" })).toBeVisible();
  const event = page.locator(".week-event", { hasText: name });
  await expect(event).toBeVisible();
  await expect(page.getByText(/\d+ appointments? this week/)).toBeVisible();
  await noSideways(page);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/Calendar.png` });
  await event.click();
  await expect(page.getByLabel("Appointment details")).toContainText(name);
  await page.getByLabel("Appointment details").getByRole("button", { name: "Close" }).click();
  await page.getByRole("button", { name: "Day", exact: true }).click();
  await expect(page.locator(".day-card", { hasText: name })).toBeVisible();

  // Phone: a list with the full name and a status word, details open as a sheet.
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto(`/app/appointments?date=${date}`);
  const row = page.locator(".phone-day-row", { hasText: name });
  await expect(row).toBeVisible();
  await expect(page.locator(".day-grid")).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Day" })).toBeVisible();
  await noSideways(page);
  expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/PhoneCalendar.png` });
  await row.click();
  await expect(page.getByLabel("Appointment details")).toContainText(name);
  await expect(page.getByRole("button", { name: "Reschedule" })).toBeVisible();
});
